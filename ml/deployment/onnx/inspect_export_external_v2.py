"""Export the final checkpoint without changing deployment; measure all outputs.

Run with the existing conversion venv. Only preprocessing functions are extracted;
no training or dataset-building cells are executed.
"""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS', '2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS', '2')
import ast
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image
import PIL
import tensorflow as tf
import keras
import onnx
import onnxruntime as ort
import tf2onnx

ROOT = Path(__file__).resolve().parents[3]
NAME = 'Baybayin_EfficientNetB0_ExternalFirst_v2'
SOURCE = ROOT / 'research/models' / (NAME + '.keras')
LABELS = ROOT / (NAME + '_labels.json')
OUT = ROOT / 'ml/deployment/onnx/artifacts/external-v2'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
mapping = json.loads(LABELS.read_text())
assert len(mapping['label_to_id']) == len(mapping['id_to_label']) == 63
assert set(mapping['label_to_id'].values()) == set(range(63))
labels = [mapping['id_to_label'][str(i)] for i in range(63)]
assert len(set(labels)) == 63
assert all(mapping['label_to_id'][label] == i for i, label in enumerate(labels))
model = keras.models.load_model(SOURCE, compile=False)
assert len(model.inputs) == len(model.outputs) == 1
assert tuple(model.inputs[0].shape) == (None, 96, 96, 1)
assert tuple(model.outputs[0].shape) == (None, 63)
assert model.inputs[0].dtype == model.outputs[0].dtype == 'float32'
inspection = {'name': model.name, 'inputs': [{'name': x.name, 'shape': list(x.shape), 'dtype': x.dtype} for x in model.inputs],
              'outputs': [{'name': x.name, 'shape': list(x.shape), 'dtype': x.dtype} for x in model.outputs],
              'outputNames': model.output_names, 'layers': []}
for layer in model.layers:
    config = layer.get_config()
    inspection['layers'].append({'name': layer.name, 'class': type(layer).__name__,
                                'config': {k: config[k] for k in ['scale', 'offset', 'units', 'activation', 'rate'] if k in config}})
    if layer.name == 'efficientnetb0':
        inspection['backbonePreprocessing'] = [{'name': x.name, 'class': type(x).__name__, 'config': x.get_config()} for x in layer.layers if isinstance(x, (keras.layers.Rescaling, keras.layers.Normalization))]
(OUT / 'inspection.json').write_text(json.dumps(inspection, indent=2))
print(json.dumps(inspection, indent=2), flush=True)

notebook = ROOT / 'research/notebooks/BAYA_Dataset_Rescue.ipynb'
cells = json.loads(notebook.read_text(encoding='utf-8'))['cells']
nodes = ast.parse(''.join(cells[4]['source']) + '\n' + ''.join(cells[36]['source'])).body
selected = [n for n in nodes if (isinstance(n, ast.FunctionDef) and n.name == 'load_image_array') or
            (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ['IMAGE_PADDING_RATIO', 'INK_THRESHOLD'] for t in n.targets))]
namespace = {'np': np, 'Image': Image, 'IMG_HEIGHT': 96, 'IMG_WIDTH': 96}
exec(compile(ast.Module(body=selected, type_ignores=[]), str(notebook), 'exec'), namespace)
assert NAME + '.keras' in ''.join(cells[43]['source'])
assert 'enumerate(sorted(EXPECTED_LABELS))' in ''.join(cells[36]['source'])
groups = {}
for node in ast.parse(''.join(cells[6]['source'])).body:
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List):
        groups[node.targets[0].id] = ast.literal_eval(node.value)
# Validate the JSON against training; deployment order still comes only from JSON.
assert labels == sorted(sum((groups[k] for k in ['VOWELS', 'BASE_CONSONANTS', 'A_FORMS', 'EI_FORMS', 'OU_FORMS']), []))
fixtures = ROOT/'apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0'
fixture_audit = json.loads((fixtures/'training-audit.json').read_text())
for sample in fixture_audit['samples']:
    actual = namespace['load_image_array'](ROOT/sample['source']).flatten()
    expected = np.fromfile(fixtures/sample['id']/'image.f32', dtype='<f4')
    assert np.array_equal(actual, expected), sample['id']
(ROOT/'docs/ml/external-v2-preprocessing.json').write_text(json.dumps({
    'notebook': notebook.name, 'notebookSha256': sha(notebook), 'preprocessingCell': 36, 'configurationCell': 4,
    'sampleCount': len(fixture_audit['samples']), 'maximumAbsoluteDifference': 0, 'fixtureSet': 'imagenet-finetune-1.0',
    'note': 'Each existing fixture was independently recomputed using the final v2 notebook function; every float matched.'
}, indent=2)+'\n')
cases = {'zeros': np.zeros((1,96,96,1), np.float32),
         'synthetic': (np.arange(96*96, dtype=np.float32).reshape(1,96,96,1) % 97) / np.float32(96),
         'random': np.random.default_rng(20261007).random((1,96,96,1), dtype=np.float32)}
sources = {}
rasters = {}
paths = sorted((ROOT/'Gavino_Baybayin_PNG').rglob('*.png'))
paths += sorted((ROOT/'apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0/edge-sources').glob('*.png'))
for i, path in enumerate(paths):
    name = f'sample-{i:03d}'
    cases[name] = namespace['load_image_array'](path)[None, ...]
    sources[name] = str(path.relative_to(ROOT))
    rgba = Image.open(path).convert('RGBA')
    rasters[name] = {'width': rgba.width, 'height': rgba.height, 'rgba': base64.b64encode(rgba.tobytes()).decode()}
for path in sorted((ROOT/'ml/diagnostics/captures').glob('*.json')):
    capture = json.loads(path.read_text(encoding='utf-8'))
    if 'raster' not in capture:
        continue
    raster = capture['raster']
    rgba = Image.frombytes('RGBA', (raster['width'], raster['height']), base64.b64decode(raster['rgbaBase64']))
    temp = OUT/(path.stem+'.png')
    rgba.save(temp)
    name = 'capture-' + path.stem
    cases[name] = namespace['load_image_array'](temp)[None, ...]
    sources[name] = str(path.relative_to(ROOT))
    rasters[name] = {'width': rgba.width, 'height': rgba.height, 'rgba': raster['rgbaBase64']}
reference = {name: np.asarray(model(x, training=False)) for name, x in cases.items()}
(OUT/'browser-cases.json').write_text(json.dumps([
    {'name': name, 'raster': rasters.get(name), 'input': x.flatten().tolist(), 'keras': reference[name].flatten().tolist()}
    for name, x in cases.items()]))
np.savez(OUT/'conversion-reference.npz', **{k+'__input': v for k,v in cases.items()}, **{k+'__keras':v for k,v in reference.items()})
# Runtime is pinned to 1.30.0. Opset 18 is supported by this runtime and
# this installed converter (tf2onnx 1.17); browser WASM execution is tested separately.
OPSET = 18
assert json.loads((ROOT/'node_modules/onnxruntime-web/package.json').read_text())['version'] == '1.30.0'
destination = OUT/(NAME+'.onnx')
model.export(str(destination), format='onnx', input_signature=[tf.TensorSpec([1,96,96,1], tf.float32, name='image_input')], opset_version=OPSET, verbose=False)
graph = onnx.load(str(destination))
consumed = {i for n in graph.graph.node for i in n.input} | {o.name for o in graph.graph.output}
removed = [i.name for i in graph.graph.input if i.name not in consumed]
for item in list(graph.graph.input):
    if item.name in removed:
        graph.graph.input.remove(item)
onnx.checker.check_model(graph)
onnx.save(graph, str(destination))
session = ort.InferenceSession(str(destination), providers=['CPUExecutionProvider'])
assert len(session.get_inputs()) == len(session.get_outputs()) == 1
assert session.get_inputs()[0].shape == [1,96,96,1]
assert session.get_outputs()[0].shape == [1,63]
rows = []
for name, x in cases.items():
    expected = reference[name]
    actual = session.run(None, {session.get_inputs()[0].name: x})[0]
    assert actual.shape == expected.shape == (1,63)
    assert np.isfinite(actual).all() and np.isfinite(expected).all()
    difference = np.abs(actual-expected)
    kt = np.argsort(-expected[0], kind='stable')[:3]
    ot = np.argsort(-actual[0], kind='stable')[:3]
    rows.append({'sample': name, 'source': sources.get(name), 'kerasTop1': labels[int(kt[0])], 'onnxTop1': labels[int(ot[0])],
                 'kerasTop3': [labels[int(i)] for i in kt], 'onnxTop3': [labels[int(i)] for i in ot],
                 'kerasConfidence': float(expected[0, kt[0]]), 'onnxConfidence': float(actual[0, ot[0]]),
                 'maximumAbsoluteDifference': float(difference.max()), 'meanAbsoluteDifference': float(difference.astype('float64').mean()),
                 'top1Match': bool(kt[0] == ot[0]), 'top3Match': bool(np.array_equal(kt, ot))})
maximum = max(r['maximumAbsoluteDifference'] for r in rows)
passed = all(r['top1Match'] and r['top3Match'] for r in rows) and maximum <= 1e-5
report = {'source': str(SOURCE), 'sourceSha256': sha(SOURCE), 'labelsSource': str(LABELS), 'labelsSha256': sha(LABELS),
          'versions': {'tensorflow': tf.__version__, 'keras': keras.__version__, 'tf2onnx': tf2onnx.__version__, 'onnx': onnx.__version__, 'onnxruntime': ort.__version__, 'pillow': PIL.__version__},
          'opset': OPSET, 'onnx': str(destination), 'onnxBytes': destination.stat().st_size, 'onnxSha256': sha(destination),
          'inputs': [{'name': x.name, 'shape': x.shape, 'dtype': x.type} for x in session.get_inputs()],
          'outputs': [{'name': x.name, 'shape': x.shape, 'dtype': x.type} for x in session.get_outputs()],
          'removedUnusedInputs': removed, 'orderedLabels': labels, 'sampleCount': len(rows), 'top1Matches': sum(r['top1Match'] for r in rows),
          'top3Matches': sum(r['top3Match'] for r in rows), 'maximumAbsoluteDifference': maximum,
          'meanAbsoluteDifference': sum(r['meanAbsoluteDifference'] for r in rows)/len(rows), 'absoluteTolerance': 1e-5,
          'conversionParityPassed': passed, 'preprocessingProvenanceConfirmed': True, 'notebook': notebook.name,
          'preprocessingCell': 36, 'configurationCell': 4, 'notebookSha256': sha(notebook), 'cases': rows}
(OUT/'conversion-parity.json').write_text(json.dumps(report, indent=2)+'\n')
(ROOT/'docs/ml/external-v2-parity.json').write_text(json.dumps(report, indent=2)+'\n')
(ROOT/'docs/ml/external-v2-inspection.json').write_text(json.dumps(inspection, indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['cases', 'orderedLabels']}, indent=2), flush=True)
assert passed, 'Conversion parity failed; do not integrate'
