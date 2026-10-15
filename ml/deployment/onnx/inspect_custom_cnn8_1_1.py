"""Inspect both candidates without training, modifying sources, or activation."""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS', '2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS', '2')
import hashlib
import json
import zipfile
from pathlib import Path
import numpy as np
import keras
import tensorflow as tf

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'ml/deployment/onnx/artifacts/custom-cnn8-1.1'
OUT.mkdir(parents=True, exist_ok=True)
models = []
rows = []
for name in ['Baybayin_CustomCNN8_1.1', 'Baybayin_CustomCNN8_cp_1.1']:
    path = ROOT/(name+'.keras')
    model = keras.models.load_model(path, compile=True)
    with zipfile.ZipFile(path) as archive:
        config = json.loads(archive.read('config.json'))
        saved = json.loads(archive.read('metadata.json'))
    with (OUT/(name+'-summary.txt')).open('w', encoding='utf-8') as output:
        model.summary(print_fn=lambda line: output.write(line+'\n'))
    row = {'path': str(path), 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
           'modelName': model.name, 'inputs': [{'name': x.name, 'shape': list(x.shape), 'dtype': x.dtype} for x in model.inputs],
           'outputs': [{'name': x.name, 'shape': list(x.shape), 'dtype': x.dtype} for x in model.outputs], 'outputNames': model.output_names,
           'parameters': model.count_params(), 'trainableParameters': sum(int(np.prod(x.shape)) for x in model.trainable_weights),
           'nonTrainableParameters': sum(int(np.prod(x.shape)) for x in model.non_trainable_weights),
           'optimizerIterations': int(model.optimizer.iterations.numpy()), 'compileConfig': config.get('compile_config'),
           'savedMetadata': saved, 'layers': [{'name': x.name, 'class': type(x).__name__, 'config': x.get_config()} for x in model.layers]}
    rows.append(row)
    models.append(model)
assert len(models[0].get_weights()) == len(models[1].get_weights())
weights_equal = all(np.array_equal(a, b) for a,b in zip(models[0].get_weights(), models[1].get_weights()))
differences = [{'index': i, 'shape': list(a.shape), 'maxAbsDifference': float(np.max(np.abs(a-b)))}
               for i,(a,b) in enumerate(zip(models[0].get_weights(), models[1].get_weights())) if not np.array_equal(a,b)]
report = {'tensorflow': tf.__version__, 'keras': keras.__version__, 'candidates': rows, 'weightArrayCount': len(models[0].get_weights()),
          'weightsIdentical': weights_equal, 'weightDifferences': differences,
          'architectureIdentical': models[0].to_json() == models[1].to_json()}
(ROOT/'docs/ml/custom-cnn8-1.1-inspection.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({**report, 'candidates': [{k:v for k,v in row.items() if k not in ['layers','compileConfig']} for row in rows]}, indent=2), flush=True)
