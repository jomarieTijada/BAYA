"""Faithful image-only export, training provenance audit, and strict parity gate."""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL','2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS','2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS','2')
from pathlib import Path
import json,hashlib,ast,re,shutil
from PIL import Image
import numpy as np
import tensorflow as tf
import keras,onnx,onnxruntime as ort,tf2onnx
ROOT=Path(__file__).resolve().parents[3]
NAME='Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0'
SOURCE=ROOT/'research/models'/(NAME+'.keras')
OUT=Path(__file__).parent/'artifacts'/'imagenet-finetune-1.0'
OUT.mkdir(parents=True,exist_ok=True)
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
model=keras.models.load_model(SOURCE,compile=False)
assert len(model.inputs)==1 and tuple(model.inputs[0].shape)==(None,96,96,1)
assert tuple(model.outputs[0].shape)==(None,63)
assert str(model.inputs[0].dtype)==str(model.outputs[0].dtype)=='float32'
NOTEBOOK=ROOT/'research/notebooks/EfficientNetB0_Augmented_Comparison.ipynb'
notebook=json.loads(NOTEBOOK.read_text(encoding='utf-8'))
cell=lambda i: ''.join(notebook['cells'][i]['source'])
namespace={'np':np,'Image':Image,'IMG_HEIGHT':96,'IMG_WIDTH':96}
selected=[node for node in ast.parse(cell(18)).body if isinstance(node,ast.FunctionDef) and node.name=='load_image_array' or isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ['IMAGE_PADDING_RATIO','INK_THRESHOLD'] for t in node.targets)]
exec(compile(ast.Module(body=selected,type_ignores=[]),str(NOTEBOOK),'exec'),namespace)
groups={}
for node in ast.parse(cell(35)).body:
 if isinstance(node,ast.Assign):
  for target in node.targets:
   if isinstance(target,ast.Name) and target.id in ['vowels','base_consonants','a_forms','ei_forms','ou_forms']:
    groups[target.id]=ast.literal_eval(node.value)
labels=sorted(sum(groups.values(),[]))
assert len(labels)==len(set(labels))==63
assert 'classes = sorted(df["label"].astype(str).unique())' in cell(16)
executed=''.join(''.join(o.get('text',[])) for o in notebook['cells'][35]['outputs'])
for label in labels:
 assert re.search(r'^'+re.escape(label.replace('_','/'))+r'\s+[0-9.]+\s+[0-9.]+\s+[0-9.]+\s+10\s*$',executed,re.M),label
app_labels=json.loads((ROOT/'apps/mobile/ml/bayaActiveModel.json').read_text())['orderedLabels']
assert labels==app_labels,'Active class mapping differs'
fixtures=ROOT/'apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0'
fixtures.mkdir(parents=True,exist_ok=True)
audit={'notebook':NOTEBOOK.name,'notebookSha256':hashlib.sha256(NOTEBOOK.read_bytes()).hexdigest(),'preprocessingCell':18,'classOrderingCell':16,'executedClassReportCell':35,'orderedLabels':labels,'trainingOnlyAugmentation':True,'samples':[]}
cases={}
paths=sorted((ROOT/'Gavino_Baybayin_PNG').rglob('*.png'))
paths+=sorted((fixtures/'edge-sources').glob('*.png'))
for i,path in enumerate(paths):
 name=f'sample-{i:03d}'
 cases[name]=namespace['load_image_array'](path)[None,...]
 dest=fixtures/name;dest.mkdir(exist_ok=True)
 cases[name].astype('<f4').tofile(dest/'image.f32')
 rgba=Image.open(path).convert('RGBA')
 (dest/'input.rgba').write_bytes(rgba.tobytes())
 audit['samples'].append({'id':name,'source':str(path.relative_to(ROOT)),'width':rgba.width,'height':rgba.height})
(fixtures/'training-audit.json').write_text(json.dumps(audit,indent=2))
reference={name:np.asarray(model(image,training=False)) for name,image in cases.items()}
np.savez(OUT/'conversion-reference.npz',**{name+'__input':v for name,v in cases.items()},**{name+'__keras':v for name,v in reference.items()})
path=OUT/(NAME+'.onnx')
model.export(str(path),format='onnx',input_signature=[tf.TensorSpec([1,96,96,1],tf.float32,name='image_input')],opset_version=18,verbose=False)
graph=onnx.load(str(path))
# Remove only unused capture declarations; never approximate a consumed graph operation.
consumed={name for node in graph.graph.node for name in node.input}|{o.name for o in graph.graph.output}
removed=[i.name for i in graph.graph.input if i.name not in consumed]
for item in list(graph.graph.input):
 if item.name in removed: graph.graph.input.remove(item)
onnx.checker.check_model(graph)
onnx.save(graph,str(path))
session=ort.InferenceSession(str(path),providers=['CPUExecutionProvider'])
assert len(session.get_inputs())==1,[(i.name,i.shape) for i in session.get_inputs()]
input_name=session.get_inputs()[0].name
rows=[];total=0.;elements=0;maximum=0.
for name,image in cases.items():
 actual=session.run(None,{input_name:image})[0];expected=reference[name]
 difference=np.abs(actual-expected); maximum=max(maximum,float(difference.max()));total+=float(difference.astype('float64').sum());elements+=difference.size
 kt=np.argsort(-expected[0],kind='stable')[:3];ot=np.argsort(-actual[0],kind='stable')[:3]
 rows.append({'sample':name,'kerasTop1Index':int(kt[0]),'onnxTop1Index':int(ot[0]),'kerasConfidence':float(expected[0,kt[0]]),'onnxConfidence':float(actual[0,ot[0]]),'maximumAbsoluteDifference':float(difference.max()),'meanAbsoluteDifference':float(difference.mean()),'top1Match':bool(kt[0]==ot[0]),'top3Match':bool(np.array_equal(kt,ot)),'kerasTop3':[{'index':int(i),'probability':float(expected[0,i])} for i in kt],'onnxTop3':[{'index':int(i),'probability':float(actual[0,i])} for i in ot]})
passed=all(r['top1Match'] for r in rows) and maximum<=1e-4
report={'source':str(SOURCE),'sourceSha256':source_hash,'tensorflow':tf.__version__,'keras':keras.__version__,'onnxruntime':ort.__version__,'opset':18,'onnx':str(path),'kerasBytes':SOURCE.stat().st_size,'onnxBytes':path.stat().st_size,'inputs':[{'name':i.name,'shape':i.shape,'dtype':i.type} for i in session.get_inputs()],'outputs':[{'name':i.name,'shape':i.shape,'dtype':i.type} for i in session.get_outputs()],'removedUnusedInputs':removed,'sampleCount':len(rows),'top1Matches':sum(r['top1Match'] for r in rows),'maximumAbsoluteDifference':maximum,'meanAbsoluteDifference':total/elements,'conversionParityPassed':passed,'deploymentApproved':passed,'trainingAudit':audit,'blockers':[],'cases':rows}
(OUT/'conversion-parity.json').write_text(json.dumps(report,indent=2))
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash,'Source model changed'
print(json.dumps({k:v for k,v in report.items() if k!='cases'},indent=2),flush=True)
assert passed,'Numerical parity failed; do not deploy'

contract={'model':NAME+'.onnx','modelName':NAME,'modelVersion':'1.0','modelType':'EfficientNetB0 image-only','imageOnly':True,'sourceModel':SOURCE.name,'sourceSha256':source_hash,'runtime':'onnxruntime-web','runtimeVersion':'1.30.0','modelUrl':'/models/baya/'+NAME+'.onnx','opset':18,'logicalInputs':[{'name':i.name,'shape':i.shape,'dtype':'float32'} for i in session.get_inputs()],'output':{'name':session.get_outputs()[0].name,'shape':[1,63],'dtype':'float32'},'classCount':63,'orderedLabels':labels,'preprocessing':{'sourceNotebook':NOTEBOOK.name,'cell':18,'height':96,'width':96,'channels':1,'dtype':'float32','range':[0,1],'alpha':'composite over white','grayscale':'Pillow L','ink':'1 - gray/255','bbox':'ink > 0.08','padding':'max(2, round(max_extent * 0.15)), Python ties-to-even','centering':'zero-valued square, integer floor offsets','resize':'uint8 Pillow BILINEAR','normalization':'divide resized uint8 by 255','internal':'repeat grayscale to RGB; 255*(1-ink); EfficientNet rescaling and normalization','augmentation':'training only, disabled during inference'},'parity':{k:report[k] for k in ['sampleCount','top1Matches','maximumAbsoluteDifference','meanAbsoluteDifference','conversionParityPassed']},'removedUnusedInputs':removed}
contract['onnxSha256']=hashlib.sha256(path.read_bytes()).hexdigest()
contract_path=OUT/(NAME+'_onnx_contract.json');contract_path.write_text(json.dumps(contract,indent=2))
public=ROOT/'apps/mobile/public/models/baya'
shutil.copyfile(path,public/path.name);shutil.copyfile(contract_path,public/contract_path.name)
shutil.copyfile(contract_path,ROOT/'apps/mobile/ml/bayaActiveModel.json')
lines=['| Sample | Keras Top1 | ONNX Top1 | Keras confidence | ONNX confidence | Max diff | Match |','|---|---|---|---|---|---|---|']
for r in rows: lines.append(f"| {r['sample']} | {labels[r['kerasTop1Index']]} | {labels[r['onnxTop1Index']]} | {r['kerasConfidence']:.9f} | {r['onnxConfidence']:.9f} | {r['maximumAbsoluteDifference']:.9g} | {r['top1Match']} |")
(OUT/'parity-table.md').write_text('\n'.join(lines))
