"""Read-only inspection and strict parity of the sole production model.

Default paths are canonical. --source/--onnx allow verifying files before rename.
Never trains, converts, publishes, changes selection, or changes source bytes.
"""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS', '2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS', '2')
import argparse
import ast
import base64
import csv
import hashlib
import json
import re
from pathlib import Path
import zipfile
import numpy as np
from PIL import Image
import PIL
import tensorflow as tf
import keras
import onnx
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'ml/deployment/onnx/artifacts/efficientnetb0-model'
OUT.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=ROOT/'research/models/EfficientNetB0_model.keras')
parser.add_argument('--onnx', type=Path, default=ROOT/'ml/rollback/models/baya/EfficientNetB0_model.onnx')
parser.add_argument('--training-artifacts', type=Path, default=Path('C:/Users/jomsa/Downloads/Baybayin_EfficientNetB0_imagenet_finetuned_1.0_artifacts'))
args = parser.parse_args()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
source_hash, onnx_hash = sha(args.source), sha(args.onnx)
# Pin exact user-authoritative bytes, independently of filenames.
assert source_hash == 'd53e7becd5c15964b71198fb7b13dc90e2b6a8b2e4a0ad75527f895da130be1c'
model = keras.models.load_model(args.source, compile=True)
assert model.name == 'BAYA_EfficientNetB0'
assert len(model.inputs) == len(model.outputs) == 1
assert tuple(model.inputs[0].shape) == (None,96,96,1)
assert tuple(model.outputs[0].shape) == (None,63)
assert model.inputs[0].dtype == model.outputs[0].dtype == 'float32'
assert model.layers[-1].activation == keras.activations.softmax
assert model.get_layer('grayscale_to_rgb').get_config()['axis'] == -1
adapter = model.get_layer('ink_to_rgb_255').get_config()
assert adapter['scale'] == -255.0 and adapter['offset'] == 255.0
backbone = model.get_layer('efficientnetb0')
assert isinstance(backbone, keras.Model) and backbone.output_shape == (None,1280)
layers = []
def inventory(current, prefix=''):
    for layer in current.layers:
        layers.append({'name':prefix+layer.name,'class':type(layer).__name__,'config':layer.get_config(),'parameters':layer.count_params()})
        if isinstance(layer,keras.Model): inventory(layer,prefix+layer.name+'/')
inventory(model)
assert not any(x['class'] in ['LSTM','Bidirectional','GRU'] for x in layers)
with (OUT/'model-summary.txt').open('w',encoding='utf-8') as stream:
    model.summary(expand_nested=True,print_fn=lambda line:stream.write(line+'\n'))
with zipfile.ZipFile(args.source) as archive:
    saved = json.loads(archive.read('metadata.json'))
    compile_config = json.loads(archive.read('config.json')).get('compile_config')
inspection = {'source':str(args.source),'bytes':args.source.stat().st_size,'sha256':source_hash,
    'tensorflow':tf.__version__,'keras':keras.__version__,'modelName':model.name,'parameters':model.count_params(),
    'trainableParameters':sum(int(np.prod(x.shape)) for x in model.trainable_weights),
    'nonTrainableParameters':sum(int(np.prod(x.shape)) for x in model.non_trainable_weights),
    'inputs':[{'name':x.name,'shape':list(x.shape),'dtype':x.dtype} for x in model.inputs],
    'outputs':[{'name':x.name,'shape':list(x.shape),'dtype':x.dtype} for x in model.outputs],
    'outputNames':model.output_names,'savedMetadata':saved,'compileConfig':compile_config,'layers':layers,'imageOnlyVerified':True}
(ROOT/'docs/ml/efficientnetb0-model-inspection.json').write_text(json.dumps(inspection,indent=2)+'\n',encoding='utf-8')
notebook_path = ROOT/'research/notebooks/EfficientNetB0_Augmented_Comparison.ipynb'
cells = json.loads(notebook_path.read_text(encoding='utf-8'))['cells']
code = lambda i: ''.join(cells[i]['source'])
assert 'BACKBONE_WEIGHTS = "imagenet"' in code(4) and 'MODEL_VERSION = "1.0"' in code(4)
assert 'classes = sorted(df["label"].astype(str).unique())' in code(16)
assert 'fit_stage("finetune"' in code(32)
assert 'best_model.save(FINAL_MODEL_PATH)' in code(42)
nodes=[];loader_cell=None;groups={}
for index,cell in enumerate(cells):
    if cell['cell_type'] != 'code':continue
    for node in ast.parse(''.join(cell['source'])).body:
        if isinstance(node,ast.FunctionDef) and node.name=='load_image_array':nodes.append(node);loader_cell=index
        if isinstance(node,ast.Assign):
            for target in node.targets:
                if isinstance(target,ast.Name) and target.id in ['IMAGE_PADDING_RATIO','INK_THRESHOLD']:nodes.append(node)
                if index==36 and isinstance(target,ast.Name) and target.id in ['vowels','base_consonants','a_forms','ei_forms','ou_forms']:
                    groups[target.id]=ast.literal_eval(node.value)
labels=sorted(sum(groups.values(),[]));assert len(labels)==len(set(labels))==63
executed=''.join(''.join(o.get('text',[])) for o in cells[36]['outputs'])
for label in labels:assert re.search(r'^'+re.escape(label.replace('_','/'))+r'\s+[0-9.]+\s+[0-9.]+\s+[0-9.]+\s+10\s*$',executed,re.M),label
labels_path=args.training_artifacts/'Baybayin_EfficientNetB0_imagenet_finetuned_labels_1.0.json'
mapping=json.loads(labels_path.read_text())
assert len(mapping['label_to_id'])==len(mapping['id_to_label'])==63
assert all(mapping['id_to_label'][str(i)]==label and mapping['label_to_id'][label]==i for i,label in enumerate(labels))
test_rows=list(csv.DictReader((args.training_artifacts/'test_predictions.csv').open()))
assert sorted({r['label'] for r in test_rows})==labels
metadata=json.loads((args.training_artifacts/'Baybayin_EfficientNetB0_imagenet_finetuned_preprocessing_1.0.json').read_text())
assert [metadata[k] for k in ['image_height','image_width','image_channels']]==[96,96,1]
assert metadata['image_range']==[0,1] and metadata['image_padding_ratio']==.15 and metadata['ink_threshold']==.08
assert metadata['backbone']=='EfficientNetB0' and metadata['backbone_weights']=='imagenet'
ns={'np':np,'Image':Image,'IMG_HEIGHT':96,'IMG_WIDTH':96}
exec(compile(ast.Module(body=nodes,type_ignores=[]),str(notebook_path),'exec'),ns)
assert ns['IMAGE_PADDING_RATIO']==.15 and ns['INK_THRESHOLD']==.08
fixture_root=ROOT/'apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0'
fixture_audit=json.loads((fixture_root/'training-audit.json').read_text())
fixture_max=0.;cases={};rasters={};sources={}
for sample in fixture_audit['samples']:
    folder=fixture_root/sample['id'];raw=(folder/'input.rgba').read_bytes()
    image=Image.frombytes('RGBA',(sample['width'],sample['height']),raw)
    image.save(OUT/'preprocessing-check.png')
    tensor=ns['load_image_array'](OUT/'preprocessing-check.png')[None,...]
    expected=np.fromfile(folder/'image.f32',dtype=np.float32).reshape(1,96,96,1)
    fixture_max=max(fixture_max,float(np.abs(expected-tensor).max()))
    cases[sample['id']]=tensor;sources[sample['id']]=sample['source']
    rasters[sample['id']]={'width':image.width,'height':image.height,'rgba':base64.b64encode(raw).decode()}
assert fixture_max==0
cases.update(zeros=np.zeros((1,96,96,1),np.float32),ones=np.ones((1,96,96,1),np.float32),random=np.random.default_rng(20261008).random((1,96,96,1),dtype=np.float32))
stroke=np.zeros((1,96,96,1),np.float32);stroke[0,20:76,46:50,0]=1;stroke[0,46:50,20:76,0]=1;cases['centered-strokes']=stroke
for capture_path in sorted((ROOT/'ml/diagnostics/captures').glob('*.json')):
    capture=json.loads(capture_path.read_text(encoding='utf-8'))
    if 'raster' not in capture:continue
    raster=capture['raster'];raw=base64.b64decode(raster['rgbaBase64'])
    image=Image.frombytes('RGBA',(raster['width'],raster['height']),raw);image.save(OUT/'capture-preprocessing.png')
    name='capture-'+capture_path.stem;cases[name]=ns['load_image_array'](OUT/'capture-preprocessing.png')[None,...]
    rasters[name]={'width':image.width,'height':image.height,'rgba':raster['rgbaBase64']};sources[name]=str(capture_path.relative_to(ROOT))
reference={};names=list(cases)
for start in range(0,len(names),8):
    batch=names[start:start+8];values=np.asarray(model(np.concatenate([cases[x] for x in batch]),training=False))
    for name,output in zip(batch,values):reference[name]=output[None,:]
graph=onnx.load(str(args.onnx));onnx.checker.check_model(graph)
opset=next(x.version for x in graph.opset_import if x.domain=='');assert opset==18
session=ort.InferenceSession(str(args.onnx),providers=['CPUExecutionProvider'])
assert [(x.name,x.shape,x.type) for x in session.get_inputs()]==[('image_input',[1,96,96,1],'tensor(float)')]
assert [(x.name,x.shape,x.type) for x in session.get_outputs()]==[('Identity:0',[1,63],'tensor(float)')]
rows=[]
for name,x in cases.items():
    actual=session.run(None,{'image_input':x})[0];expected=reference[name]
    assert actual.shape==expected.shape==(1,63) and np.isfinite(actual).all() and np.isfinite(expected).all()
    assert (actual>=0).all() and (actual<=1).all() and abs(float(actual.sum())-1)<1e-3
    diff=np.abs(actual-expected);kt=np.argsort(-expected[0],kind='stable')[:3];ot=np.argsort(-actual[0],kind='stable')[:3]
    ranks=lambda values,indices:[{'index':int(i),'label':labels[int(i)],'confidence':float(values[0,i])} for i in indices]
    rows.append({'sample':name,'source':sources.get(name),'kerasProbabilities':expected[0].tolist(),'onnxProbabilities':actual[0].tolist(),
        'kerasTop3':ranks(expected,kt),'onnxTop3':ranks(actual,ot),'top1Match':bool(kt[0]==ot[0]),'top3Match':bool(np.array_equal(kt,ot)),
        'maximumAbsoluteDifference':float(diff.max()),'meanAbsoluteDifference':float(diff.astype('float64').mean())})
maximum=max(x['maximumAbsoluteDifference'] for x in rows)
passed=all(x['top1Match'] and x['top3Match'] for x in rows) and maximum<=1e-5
report={'source':str(args.source),'sourceSha256':source_hash,'sourceBytes':args.source.stat().st_size,'onnx':str(args.onnx),'onnxSha256':onnx_hash,'onnxBytes':args.onnx.stat().st_size,
    'opset':opset,'checkerPassed':True,'existingOnnxReused':True,'notebook':notebook_path.name,'notebookSha256':sha(notebook_path),'preprocessingCell':loader_cell,
    'classOrderingCell':16,'executedClassReportCell':36,'preprocessingProvenanceConfirmed':True,'labelsSource':str(labels_path),'labelsSha256':sha(labels_path),'orderedLabels':labels,
    'versions':{'tensorflow':tf.__version__,'keras':keras.__version__,'onnx':onnx.__version__,'onnxruntime':ort.__version__,'pillow':PIL.__version__},
    'sampleCount':len(rows),'top1Matches':sum(x['top1Match'] for x in rows),'top3Matches':sum(x['top3Match'] for x in rows),'maximumAbsoluteDifference':maximum,
    'meanAbsoluteDifference':sum(x['meanAbsoluteDifference'] for x in rows)/len(rows),'absoluteTolerance':1e-5,'conversionParityPassed':passed,'cases':rows}
np.savez(OUT/'golden-reference.npz',**{k+'__input':v for k,v in cases.items()},**{k+'__keras':v for k,v in reference.items()})
(OUT/'browser-cases.json').write_text(json.dumps([{'name':k,'raster':rasters.get(k),'input':x.flatten().tolist(),'keras':reference[k].flatten().tolist()} for k,x in cases.items()]))
(ROOT/'docs/ml/efficientnetb0-model-python-parity.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'docs/ml/efficientnetb0-model-preprocessing.json').write_text(json.dumps({'notebook':notebook_path.name,'notebookSha256':sha(notebook_path),'preprocessingCell':loader_cell,'classOrderingCell':16,'executedClassReportCell':36,'orderedLabels':labels,'sampleCount':len(fixture_audit['samples']),'maximumAbsoluteDifference':fixture_max,'originalFixtureNotebookSha256':fixture_audit['notebookSha256']},indent=2)+'\n')
(OUT/'labels.json').write_bytes(labels_path.read_bytes())
assert source_hash==sha(args.source) and onnx_hash==sha(args.onnx)
print(json.dumps({k:v for k,v in report.items() if k not in ['cases','orderedLabels']},indent=2),flush=True)
assert passed,'Strict parity failed; do not rename, activate or clean up'
