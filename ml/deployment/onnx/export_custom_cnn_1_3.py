"""Golden references and faithful conversion; never activate or retrain."""
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
OUT = ROOT/'ml/deployment/onnx/artifacts/custom-cnn-1.3'
OUT.mkdir(parents=True, exist_ok=True)
NAME = 'Baybayin_CustomCNN16_1.3'
SOURCE = ROOT/(NAME+'.keras')
ARTIFACTS = Path('C:/Users/jomsa/Downloads/Baybayin_CustomCNN16_1.3_artifacts')
NOTEBOOK = Path(os.environ.get('BAYA_CUSTOM_NOTEBOOK', 'C:/Users/jomsa/Downloads/Custom_CNN_8Layer_Augmented.ipynb'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
mapping = json.loads((ARTIFACTS/'Baybayin_CustomCNN16_labels_1.3.json').read_text())
assert len(mapping['label_to_id']) == len(mapping['id_to_label']) == 63
assert set(mapping['label_to_id'].values()) == set(range(63))
labels = [mapping['id_to_label'][str(i)] for i in range(63)]
assert len(set(labels)) == 63 and all(mapping['label_to_id'][x] == i for i,x in enumerate(labels))
preprocessing = json.loads((ARTIFACTS/'Baybayin_CustomCNN16_preprocessing_1.3.json').read_text())
assert [preprocessing[k] for k in ['image_height','image_width','image_channels']] == [96,96,1]
assert preprocessing['image_range'] == [0,1] and preprocessing['image_padding_ratio'] == .15 and preprocessing['ink_threshold'] == .08
cells = json.loads(NOTEBOOK.read_text(encoding='utf-8'))['cells']
selected = []
preprocess_cell = None
for index, cell in enumerate(cells):
    if cell['cell_type'] != 'code':
        continue
    for node in ast.parse(''.join(cell['source'])).body:
        if isinstance(node, ast.FunctionDef) and node.name == 'load_image_array':
            selected.append(node)
            preprocess_cell = index
        elif isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ['IMAGE_PADDING_RATIO','INK_THRESHOLD'] for t in node.targets):
            selected.append(node)
ns = {'np': np, 'Image': Image, 'IMG_HEIGHT':96, 'IMG_WIDTH':96}
exec(compile(ast.Module(body=selected,type_ignores=[]),str(NOTEBOOK),'exec'),ns)
assert ns['IMAGE_PADDING_RATIO'] == preprocessing['image_padding_ratio'] and ns['INK_THRESHOLD'] == preprocessing['ink_threshold']
provenance = any('Baybayin_CustomCNN16' in ''.join(c['source']) and '1.3' in ''.join(c['source']) for c in cells)
model = keras.models.load_model(SOURCE,compile=False)
assert len(model.inputs) == len(model.outputs) == 1 and tuple(model.inputs[0].shape) == (None,96,96,1)
assert tuple(model.outputs[0].shape) == (None,63) and model.layers[-1].activation == keras.activations.softmax
cases = {'zeros':np.zeros((1,96,96,1),np.float32),'ones':np.ones((1,96,96,1),np.float32),
         'random':np.random.default_rng(20261008).random((1,96,96,1),dtype=np.float32)}
simple = np.zeros((1,96,96,1),np.float32)
simple[0,20:76,46:50,0]=1
simple[0,46:50,20:76,0]=1
cases['centered-strokes']=simple
sources = {}
rasters = {}
targets = {}
paths = sorted((ROOT/'Gavino_Baybayin_PNG').rglob('*.png')) + sorted((ROOT/'apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0/edge-sources').glob('*.png'))
aliases = {'KIE':'ke_ki','KOU':'ko_ku','BIE':'be_bi','BOU':'bo_bu','GIE':'ge_gi','GOU':'go_gu','MIE':'me_mi','MOU':'mo_mu','SIE':'se_si','SOU':'so_su'}
for i,path in enumerate(paths):
    name = f'sample-{i:03d}'
    cases[name] = ns['load_image_array'](path)[None,...]
    sources[name] = str(path.relative_to(ROOT))
    raw = path.stem.removeprefix('Gavino Baybayin - ').upper()
    target = aliases.get(raw,raw.lower())
    targets[name] = target if target in mapping['label_to_id'] else None
    rgba=Image.open(path).convert('RGBA')
    rasters[name]={'width':rgba.width,'height':rgba.height,'rgba':base64.b64encode(rgba.tobytes()).decode()}
for path in sorted((ROOT/'ml/diagnostics/captures').glob('*.json')):
    capture=json.loads(path.read_text(encoding='utf-8'))
    if 'raster' not in capture:
        continue
    raster=capture['raster'];rgba=Image.frombytes('RGBA',(raster['width'],raster['height']),base64.b64decode(raster['rgbaBase64']))
    image_path=OUT/(path.stem+'.png');rgba.save(image_path)
    name='capture-'+path.stem;cases[name]=ns['load_image_array'](image_path)[None,...]
    sources[name]=str(path.relative_to(ROOT));targets[name]=capture.get('targetClass')
    rasters[name]={'width':rgba.width,'height':rgba.height,'rgba':raster['rgbaBase64']}
names=list(cases)
reference={}
for start in range(0,len(names),8):
    batch=names[start:start+8]
    probabilities=np.asarray(model(np.concatenate([cases[name] for name in batch]),training=False))
    for name,values in zip(batch,probabilities):reference[name]=values[None,:]
np.savez(OUT/'golden-reference.npz',**{k+'__input':v for k,v in cases.items()},**{k+'__keras':v for k,v in reference.items()})
(OUT/'browser-cases.json').write_text(json.dumps([{'name':name,'raster':rasters.get(name),'input':x.flatten().tolist(),'keras':reference[name].flatten().tolist()} for name,x in cases.items()]))
path=OUT/(NAME+'.onnx')
assert json.loads((ROOT/'node_modules/onnxruntime-web/package.json').read_text())['version']=='1.30.0'
model.export(str(path),format='onnx',input_signature=[tf.TensorSpec([1,96,96,1],tf.float32,name='image_input')],opset_version=18,verbose=False)
graph=onnx.load(str(path));onnx.checker.check_model(graph)
session=ort.InferenceSession(str(path),providers=['CPUExecutionProvider'])
assert len(session.get_inputs())==len(session.get_outputs())==1
assert session.get_inputs()[0].shape==[1,96,96,1] and session.get_outputs()[0].shape==[1,63]
external=ort.InferenceSession(str(ROOT/'apps/mobile/public/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2.onnx'),providers=['CPUExecutionProvider'])
rows=[];comparisons=[]
for name,x in cases.items():
    expected=reference[name];actual=session.run(None,{session.get_inputs()[0].name:x})[0]
    assert actual.shape==expected.shape==(1,63) and np.isfinite(actual).all() and np.isfinite(expected).all()
    diff=np.abs(actual-expected);kt=np.argsort(-expected[0],kind='stable')[:3];ot=np.argsort(-actual[0],kind='stable')[:3]
    rows.append({'sample':name,'source':sources.get(name),'target':targets.get(name),'kerasProbabilities':expected[0].tolist(),
                 'kerasTop1':labels[int(kt[0])],'kerasConfidence':float(expected[0,kt[0]]),'onnxTop1':labels[int(ot[0])],
                 'kerasTop3':[{'index':int(i),'label':labels[int(i)],'confidence':float(expected[0,i])} for i in kt],
                 'onnxTop3':[{'index':int(i),'label':labels[int(i)],'confidence':float(actual[0,i])} for i in ot],
                 'top1Match':bool(kt[0]==ot[0]),'top3Match':bool(np.array_equal(kt,ot)),
                 'maximumAbsoluteDifference':float(diff.max()),'meanAbsoluteDifference':float(diff.astype('float64').mean())})
    if targets.get(name):
        e=external.run(None,{external.get_inputs()[0].name:x})[0][0];idx=int(np.argmax(e));target=targets[name]
        comparisons.append({'sample':name,'source':sources[name],'target':target,'externalTop1':labels[idx],'externalConfidence':float(e[idx]),'externalCorrect':labels[idx]==target,
                            'customTop1':labels[int(kt[0])],'customConfidence':float(expected[0,kt[0]]),'customCorrect':labels[int(kt[0])]==target})
maximum=max(x['maximumAbsoluteDifference'] for x in rows)
passed=all(x['top1Match'] and x['top3Match'] for x in rows) and maximum<=1e-5
report={'source':str(SOURCE),'sourceSha256':sha(SOURCE),'notebook':str(NOTEBOOK),'notebookSha256':sha(NOTEBOOK),'preprocessingCell':preprocess_cell,
        'preprocessingProvenanceConfirmed':provenance,'labelsSource':str(ARTIFACTS/'Baybayin_CustomCNN16_labels_1.3.json'),
        'labelsSha256':sha(ARTIFACTS/'Baybayin_CustomCNN16_labels_1.3.json'),'orderedLabels':labels,'opset':18,'onnxBytes':path.stat().st_size,'onnxSha256':sha(path),'checkerPassed':True,
        'versions':{'tensorflow':tf.__version__,'keras':keras.__version__,'tf2onnx':tf2onnx.__version__,'onnx':onnx.__version__,'onnxruntime':ort.__version__,'pillow':PIL.__version__},
        'inputs':[{'name':x.name,'shape':x.shape,'dtype':x.type} for x in session.get_inputs()],'outputs':[{'name':x.name,'shape':x.shape,'dtype':x.type} for x in session.get_outputs()],
        'sampleCount':len(rows),'top1Matches':sum(x['top1Match'] for x in rows),'top3Matches':sum(x['top3Match'] for x in rows),'absoluteTolerance':1e-5,
        'maximumAbsoluteDifference':maximum,'meanAbsoluteDifference':sum(x['meanAbsoluteDifference'] for x in rows)/len(rows),'conversionParityPassed':passed,'cases':rows}
(ROOT/'docs/ml/custom-cnn-1.3-python-parity.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'docs/ml/custom-cnn-1.3-problem-cases.json').write_text(json.dumps(comparisons,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['cases','orderedLabels']},indent=2),flush=True)
assert passed,'Conversion gate failed; do not integrate'
