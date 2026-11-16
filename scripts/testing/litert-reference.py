"""Extract only inspected pure definitions; never execute training notebook cells."""
import ast
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw
import torch
from torch import nn
from torch.nn import functional as F
from torchvision.models import resnet18, ResNet18_Weights

ROOT = Path(__file__).resolve().parents[2]
NOTEBOOK = ROOT / 'BAYA_ResNet18_Spatial_Training.ipynb'
SOURCE = Path.home() / 'Downloads/BAYA_ResNet18_AutoSpatial'
OUT = ROOT / 'apps/mobile/ml/__tests__/fixtures/resnet18-spatial-v1'
OUT.mkdir(parents=True, exist_ok=True)
nb = json.loads(NOTEBOOK.read_text(encoding='utf-8'))
labels = json.loads((SOURCE / 'labels.json').read_text())
scope = dict(Image=Image, np=np, cv2=cv2, IMG_SIZE=160, torch=torch, nn=nn, F=F,
             resnet18=resnet18, ResNet18_Weights=ResNet18_Weights,
             BASES=labels['bases'], MODIFIERS=labels['modifiers'])
definitions = []
for cell in nb['cells']:
    if cell['cell_type'] != 'code': continue
    text = ''.join(cell['source'])
    if not any(term in text for term in ('def prepare(', 'class BayaResNet18(')): continue
    tree = ast.parse(text)
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in ('prepare', 'BayaResNet18'):
            definitions.append(ast.get_source_segment(text, node))
            exec(compile(ast.Module(body=[node], type_ignores=[]), str(NOTEBOOK), 'exec'), scope)
(ROOT / 'docs/ml/resnet18-spatial-v1/notebook-definitions.py').write_text('\n\n'.join(definitions) + '\n')
model = scope['BayaResNet18'](pretrained=False)
checkpoint = torch.load(SOURCE / 'best_resnet18.pt', map_location='cpu', weights_only=True)
print('checkpoint keys', list(checkpoint)[:8])
model.load_state_dict(checkpoint.get('model_state', checkpoint.get('model_state_dict', checkpoint)))
model.eval()
rows = []
images = []
for label in ['a', 'ba', 'be_bi', 'bo_bu', 'b', 'nga', 'ra']:
    images.append((label, Image.open(ROOT / f'apps/mobile/assets/illustrations/baybayin/guides-1024/{label}.png').convert('RGBA')))
rng = np.random.default_rng(117)
images.append(('rgba-random', Image.fromarray(rng.integers(0, 256, (47, 83, 4), dtype=np.uint8))))
im = Image.new('RGBA', (257, 163), (255, 255, 255, 255))
d = ImageDraw.Draw(im); d.line([(0, 3), (90, 50), (140, 130)], fill=(0, 0, 0, 255), width=4)
d.ellipse((125, 15, 132, 23), fill=(80, 20, 90, 127)); images.append(('edge-strokes', im))
for name, image in images:
    file = OUT / f'{name}.png'; image.save(file)
    np.asarray(image).tofile(OUT / f'{name}.rgba')
    ink, matrix, size = scope['prepare'](file)
    rgb = np.repeat((1.0 - ink)[None], 3, axis=0)
    tensor = (rgb - np.array([.485, .456, .406], np.float32)[:, None, None]) / np.array([.229, .224, .225], np.float32)[:, None, None]
    tensor.tofile(OUT / f'{name}.f32')
    with torch.no_grad(): values = [v.numpy().reshape(-1).tolist() for v in model(torch.from_numpy(tensor[None]))]
    rows.append(dict(id=name, width=size[0], height=size[1], matrix=matrix.tolist(), outputs=dict(zip(labels['output_order'], values))))
report = dict(notebookSha256=hashlib.sha256(NOTEBOOK.read_bytes()).hexdigest(),
              checkpointSha256=hashlib.sha256((SOURCE / 'best_resnet18.pt').read_bytes()).hexdigest(), samples=rows,
              limitation='Bundled reference art and synthetic images verify plumbing/parity, not independent handwriting accuracy.')
(OUT / 'reference.json').write_text(json.dumps(report, indent=2) + '\n')
print('Wrote', len(rows), 'reference cases')
