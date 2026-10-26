"""Stage the original hybrid checkpoint and gate conversion on full-vector parity.

Run with the pinned deployment .venv; never writes to the active app.
"""
import argparse
import ast
import hashlib
import json
import os
import shutil
from pathlib import Path

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS', '2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS', '2')
import keras
import numpy as np
import onnx
import onnxruntime as ort
import tensorflow as tf
import tf2onnx
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
NAME = 'Baybayin_EfficientNetB0_BiLSTM_1.1'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, default=Path(__file__).parent/'artifacts/bilstm-v1.1-replacement')
    args = parser.parse_args()
    src, out = args.source_dir, args.output_dir
    out.mkdir(parents=True, exist_ok=True)
    fixtures = ROOT/'ml/rollback/fixtures/bilstm-v1.1'
    shutil.copytree(fixtures, out/'fixtures', dirs_exist_ok=True)
    shutil.copyfile(ROOT/'ml/rollback/runtime/bilstmSequence.ts.txt', out/'bilstmSequence.ts')
    notebook = ROOT/'ml/training/BAYA_EfficientNetB0_BiLSTM_v1_1_Refinement.ipynb'
    cells = json.loads(notebook.read_text(encoding='utf-8'))['cells']
    preprocessing = dict(np=np, Image=Image, INK_THRESHOLD=.08, IMAGE_PADDING_RATIO=.15,
        TRAJECTORY_PADDING_RATIO=.15, IMG_WIDTH=96, IMG_HEIGHT=96, MAX_SEQ_LEN=512, SEQ_FEATURES=6)
    # Execute only the inspected pure preprocessing definitions, never notebook training.
    for index in (9, 10):
        tree = ast.parse(''.join(cells[index]['source']))
        assert all(isinstance(node, ast.FunctionDef) for node in tree.body)
        exec(compile(tree, str(notebook), 'exec'), preprocessing)
    metrics = json.loads((src/'Baybayin_EfficientNetB0_BiLSTM_v1_1_metrics.json').read_text())
    assert metrics['selected_candidate'] == 'v1.1_stageB' and metrics['promoted_to_v1_1']
    assert sha(src/f'{NAME}_stageB.keras') == sha(src/f'{NAME}.keras'), 'Promoted artifact differs from selected checkpoint'
    mapping = json.loads((src/'Baybayin_EfficientNetB0_BiLSTM_labels_1.1.json').read_text())
    labels = [mapping['id_to_label'][str(i)] for i in range(63)]
    assert len(set(labels)) == 63 and all(mapping['label_to_id'][v] == i for i,v in enumerate(labels))
    inspections = []
    for stage in ['stageA', 'stageB']:
        path = src/f'{NAME}_{stage}.keras'
        model = keras.models.load_model(path, compile=False)
        assert [list(x.shape) for x in model.inputs] == [[None,96,96,1],[None,512,6]]
        assert list(model.output.shape) == [None,63]
        assert all(x.dtype == 'float32' for x in model.inputs + model.outputs)
        assert model.get_layer('stroke_bilstm').merge_mode == 'concat'
        inspections.append({'file':path.name,'sha256':sha(path),'bytes':path.stat().st_size,
            'parameters':model.count_params(),'inputs':[{'name':x.name,'shape':list(x.shape),'dtype':x.dtype} for x in model.inputs],
            'outputNames':model.output_names,'outputShape':list(model.output.shape),'config':model.get_config()})
    (out/'inspection.json').write_text(json.dumps(inspections,indent=2))
    signature = [tf.TensorSpec([1,96,96,1],tf.float32,name='image_input'),tf.TensorSpec([1,512,6],tf.float32,name='sequence_input')]
    target = out/f'{NAME}.onnx'
    model.export(str(target),format='onnx',input_signature=(signature,),opset_version=18,verbose=False)
    graph = onnx.load(target)
    # The exporter exposes unused normalization captures. Remove only graph inputs
    # proven unreferenced anywhere, including nested control-flow subgraphs.
    def used(g):
        names = {n for node in g.node for n in node.input} | {v.name for v in g.output}
        for node in g.node:
            for attr in node.attribute:
                if attr.type == onnx.AttributeProto.GRAPH: names |= used(attr.g)
                elif attr.type == onnx.AttributeProto.GRAPHS:
                    for sub in attr.graphs: names |= used(sub)
        return names
    references = used(graph.graph)
    removed = []
    for value in list(graph.graph.input):
        if value.name not in {'image_input','sequence_input'} and value.name not in references:
            removed.append(value.name);graph.graph.input.remove(value)
    onnx.checker.check_model(graph,full_check=True)
    onnx.save(graph,target)
    session = ort.InferenceSession(str(target),providers=['CPUExecutionProvider'])
    assert [(v.name,v.shape,v.type) for v in session.get_inputs()] == [('image_input',[1,96,96,1],'tensor(float)'),('sequence_input',[1,512,6],'tensor(float)')]
    assert session.get_outputs()[0].shape == [1,63]
    cases=[]
    for folder in sorted((out/'fixtures').iterdir()):
        if folder.is_dir() and (folder/'sequence.f32').exists():
            cases.append((folder.name,np.fromfile(folder/'image.f32',dtype='<f4').reshape(1,96,96,1),np.fromfile(folder/'sequence.f32',dtype='<f4').reshape(1,512,6)))
    for path in [fixtures/'real-ka.json']:
        c=json.loads(path.read_text())
        if 'sequence' in c.get('webInputs',{}): cases.append((path.stem,np.array(c['webInputs']['image'],dtype='float32').reshape(1,96,96,1),np.array(c['webInputs']['sequence'],dtype='float32').reshape(1,512,6)))
    assert cases, 'No paired parity fixtures available'
    results=[]
    browser_cases=[]
    for name,image,sequence in cases:
        browser_case = dict(name=name,image=image.flatten().tolist(),sequence=sequence.flatten().tolist())
        folder = out/'fixtures'/name
        if folder.is_dir():
            row = json.loads((folder/'input.json').read_text())
            assert np.array_equal(preprocessing['load_image_array'](folder/'source.png').flatten(), image.flatten())
            assert np.array_equal(preprocessing['build_sequence'](row).flatten(), sequence.flatten())
            browser_case.update(row=row,rgba=list((folder/'input.rgba').read_bytes()))
        expected=np.asarray(model([image,sequence],training=False))
        browser_case['expected']=expected.flatten().tolist()
        browser_cases.append(browser_case)
        actual=session.run(None,{'image_input':image,'sequence_input':sequence})[0]
        delta=np.abs(expected-actual)
        topk=np.argsort(-expected[0])[:3];topo=np.argsort(-actual[0])[:3]
        passed=bool(np.isfinite(actual).all() and delta.max()<=1e-5 and delta.mean()<=1e-6 and np.array_equal(topk,topo) and abs(actual.sum()-1)<1e-5)
        results.append({'sample':name,'keras':expected[0].tolist(),'onnx':actual[0].tolist(),'kerasTop3':[labels[i] for i in topk],'onnxTop3':[labels[i] for i in topo],'maxAbsoluteDifference':float(delta.max()),'meanAbsoluteDifference':float(delta.mean()),'passed':passed})
        np.savez(out/f'{name}.npz',image=image,sequence=sequence,expected=expected)
        print(name,results[-1]['maxAbsoluteDifference'],passed,flush=True)
    report={'source':inspections[-1]['file'],'sourceSha256':inspections[-1]['sha256'],'parameters':model.count_params(),'onnxBytes':target.stat().st_size,'onnxSha256':sha(target),'opset':18,'removedUnusedInputs':removed,'versions':{m.__name__:m.__version__ for m in [tf,keras,tf2onnx,onnx,ort]},'absoluteTolerance':1e-5,'meanTolerance':1e-6,'cases':results,'passed':all(r['passed'] for r in results),'orderedLabels':labels}
    (out/'parity.json').write_text(json.dumps(report,indent=2))
    (out/'browser-cases.json').write_text(json.dumps(browser_cases))
    assert report['passed'], 'Parity failed; active app has not been modified'
    print('STAGED PARITY PASSED',flush=True)

if __name__ == '__main__': main()
