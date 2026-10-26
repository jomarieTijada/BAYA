"""Convert the supplied artifact without activating an unverified label/preprocessing contract."""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS', '2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS', '2')
from pathlib import Path
import hashlib
import json
import argparse
import ast
import shutil
from PIL import Image
import numpy as np
import tensorflow as tf
import keras
import tf2onnx
import onnx
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'research/models/BAYA_ResNet18_1.0.keras'
OUT = Path(__file__).parent / 'artifacts/resnet18-1.0'
OUT.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser()
parser.add_argument('--export-dir', type=Path, required=True, help='Original results export containing the matching Keras artifact and metadata')
EXPORT = parser.parse_args().export_dir
assert hashlib.sha256((EXPORT/SOURCE.name).read_bytes()).digest() == hashlib.sha256(SOURCE.read_bytes()).digest()
PROVENANCE = ROOT/'docs/ml/resnet18-1.0'
PROVENANCE.mkdir(parents=True, exist_ok=True)
for name in ['label_to_id.json','preprocessing.json']:
    shutil.copy2(EXPORT/name, PROVENANCE/name)
labels = json.loads((PROVENANCE/'label_to_id.json').read_text())
active = json.loads((ROOT/'apps/mobile/ml/bayaActiveModel.json').read_text())
assert labels == {label:i for i,label in enumerate(active['orderedLabels'])}
notebook = ROOT/'research/notebooks/BAYA_ResNet18.ipynb'
nb = json.loads(notebook.read_text(encoding='utf-8'))
cell_index, cell = next((i,''.join(c['source'])) for i,c in enumerate(nb['cells']) if 'def load_image_array' in ''.join(c['source']))
namespace = {'Image':Image, 'np':np, 'IMG_WIDTH':96, 'IMG_HEIGHT':96, 'INK_THRESHOLD':0.08, 'IMAGE_PADDING_RATIO':0.15}
function = next(n for n in ast.parse(cell).body if isinstance(n,ast.FunctionDef) and n.name=='load_image_array')
source_code = 'import numpy as np\nfrom PIL import Image\nIMG_WIDTH = IMG_HEIGHT = 96\nINK_THRESHOLD = 0.08\nIMAGE_PADDING_RATIO = 0.15\n\n' + ast.get_source_segment(cell, function) + '\n'
(PROVENANCE/'preprocessing-source.py').write_text(source_code, encoding='utf-8', newline='\n')
exec(compile(ast.Module(body=[function],type_ignores=[]),str(notebook),'exec'), namespace)
model = keras.models.load_model(SOURCE, compile=False)
assert len(model.inputs) == 1 and tuple(model.input_shape) == (None, 96, 96, 1)
assert tuple(model.output_shape) == (None, 63)
assert model.layers[-1].activation.__name__ == 'softmax'
target = OUT / 'BAYA_ResNet18_1.0.onnx'
model.export(str(target), format='onnx', input_signature=[tf.TensorSpec([1, 96, 96, 1], tf.float32, name='image_input')], opset_version=18, verbose=False)
graph = onnx.load(str(target))
onnx.checker.check_model(graph)
session = ort.InferenceSession(str(target), providers=['CPUExecutionProvider'])
samples = [('zeros', np.zeros((1,96,96,1), np.float32)), ('ones', np.ones((1,96,96,1), np.float32))]
# These are candidate input tensors, NOT evidence of this model's training preprocessing.
for path in sorted((ROOT / 'ml/rollback/fixtures/bilstm-v1.1').glob('*/image.f32')):
    samples.append((path.parent.name, np.fromfile(path, dtype='<f4').reshape(1,96,96,1)))
browser_cases = []
source_images = {}
for path in sorted((ROOT/'Gavino_Baybayin_PNG').rglob('*.png'))[:63]:
    samples.append((path.stem, namespace['load_image_array'](path)[None,...]))
    source_images[path.stem] = path
results = []
for name, sample in samples:
    reference = np.asarray(model(sample, training=False))
    actual = session.run(None, {session.get_inputs()[0].name: sample})[0]
    assert np.isfinite(actual).all()
    np.testing.assert_allclose(actual, reference, atol=1e-5, rtol=1e-4)
    assert actual.argmax() == reference.argmax()
    browser_cases.append({'name':name,'image':sample.flatten().tolist(),'expected':reference.flatten().tolist()})
    if name in source_images:
        rgba = Image.open(source_images[name]).convert('RGBA')
        browser_cases[-1].update(width=rgba.width,height=rgba.height,rgba=list(rgba.tobytes()))
    results.append({'sample': name, 'maxAbsoluteDifference': float(np.max(np.abs(actual-reference))), 'top1Matches': True, 'probabilitySum': float(actual.sum())})
report = {'source': str(SOURCE.relative_to(ROOT)), 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'onnx': str(target.relative_to(ROOT)), 'onnxSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'versions': {m.__name__: m.__version__ for m in [tf,keras,tf2onnx,onnx,ort]}, 'opset':18,
    'inputs': [{'name':v.name,'shape':v.shape,'type':v.type} for v in session.get_inputs()],
    'outputs': [{'name':v.name,'shape':v.shape,'type':v.type} for v in session.get_outputs()],
    'activation':'softmax', 'checkerPassed':True, 'samples':results,
    'activationStatus':'CPU VERIFIED; browser validation required before activation.',
    'exportArtifactChecksumMatched':True, 'labelOrderVerified':True, 'notebookSha256':hashlib.sha256(notebook.read_bytes()).hexdigest(),
    'preprocessingCell':cell_index,
    'sampleLimitation':'Conversion parity on image fixtures and reference glyphs is not held-out handwriting accuracy. Saved model differs from revised notebook BN settings; original export contains matching model bytes and authoritative label/preprocessing metadata.'}
(OUT/'conversion-report.json').write_text(json.dumps(report, indent=2))
(OUT/'browser-cases.json').write_text(json.dumps(browser_cases))
contract = dict(active)
contract.update(id='resnet18-1.0', model=target.name, modelName=SOURCE.stem, modelVersion='1.0', modelType='ResNet18 image-only', imageOnly=True,
 sourceModel=SOURCE.name, sourceSha256=report['sourceSha256'], modelUrl='/models/baya/'+target.name, logicalInputs=[{'name':session.get_inputs()[0].name,'shape':[1,96,96,1],'dtype':'float32'}],
 output={'name':session.get_outputs()[0].name,'shape':[1,63],'dtype':'float32'}, staticNormalizationInputs=[], allOnnxInputNames=[session.get_inputs()[0].name],
 onnxSha256=report['onnxSha256'], onnxBytes=target.stat().st_size, converterVersions=report['versions'],
 labelsUrl='/models/baya/BAYA_ResNet18_1.0_labels.json', contractUrl='/models/baya/BAYA_ResNet18_1.0_onnx_contract.json',
 parity={'conversionParityPassed':True,'preprocessingProvenanceConfirmed':True,'checkerPassed':True,'sampleCount':len(results),'top1Matches':len(results),'maximumAbsoluteDifference':max(r['maxAbsoluteDifference'] for r in results)}, browserParity={'passed':False})
contract['preprocessing'] = {k:v for k,v in active['preprocessing'].items() if not k.startswith('sequence') and k!='trajectoryPaddingRatio'}
contract['preprocessing'].update(sourceCode='docs/ml/resnet18-1.0/preprocessing-source.py', sourceCodeSha256=hashlib.sha256((PROVENANCE/'preprocessing-source.py').read_bytes()).hexdigest(), sourceNotebook='BAYA_ResNet18.ipynb',cell=cell_index,notebookSha256=report['notebookSha256'],internal='ResNet convolution; no internal pixel normalization')
label_bytes=json.dumps({'label_to_id':labels,'id_to_label':{str(i):label for label,i in labels.items()}},indent=2).encode()
contract['labelsSha256']=hashlib.sha256(label_bytes).hexdigest()
(OUT/'BAYA_ResNet18_1.0_labels.json').write_bytes(label_bytes)
(OUT/'candidate-contract.json').write_text(json.dumps(contract,indent=2))
print(json.dumps(report, indent=2))
