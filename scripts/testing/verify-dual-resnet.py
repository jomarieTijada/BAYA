"""Reproducible graph/hash inspection and Python reference outputs (not accuracy validation)."""
import json, hashlib
from pathlib import Path
import numpy as np
import onnx, onnxruntime as ort
root = Path('apps/mobile/public/models/baya')
fixtures = Path('apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0')
out = Path('docs/verification/compliance-12/dual-model'); out.mkdir(parents=True, exist_ok=True)
audit = json.loads((fixtures / 'training-audit.json').read_text())
samples = audit['samples'][::7]
report = {'models': {}, 'samples': [], 'purpose': 'Historical preprocessing fixtures; not independent labeled handwriting accuracy'}
sessions = {}
for key in ['character', 'validity']:
    file = root / ('baya_' + key + '.onnx')
    model = onnx.load(str(file)); onnx.checker.check_model(model)
    sessions[key] = ort.InferenceSession(str(file), providers=['CPUExecutionProvider'])
    report['models'][key] = {'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'finalOperation': model.graph.node[-1].op_type, 'inputShape': sessions[key].get_inputs()[0].shape, 'outputShape': sessions[key].get_outputs()[0].shape}
for sample in samples:
    image = np.fromfile(fixtures / sample['id'] / 'image.f32', dtype=np.float32).reshape(1,96,96,1)
    row = {k: sample[k] for k in ['id','width','height']}
    for key, session in sessions.items(): row[key] = session.run(None, {'image_input': image})[0].flatten().tolist()
    report['samples'].append(row)
(out / 'python-reference.json').write_text(json.dumps(report, indent=2))
print('Checked both graphs and generated', len(samples), 'Python references per model')
