"""Compare an image-only browser capture to training preprocessing and CPU ONNX."""
from __future__ import annotations
import argparse, ast, base64, json, tempfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def compare_notebook(path: Path, cpu_replay: bool = False) -> dict:
    capture = json.loads(path.read_text(encoding='utf-8'))
    contract = json.loads((ROOT / 'apps/mobile/ml/bayaActiveModel.json').read_text())
    if capture.get('schemaVersion') != 2 or capture.get('modelName') != contract['modelName']:
        raise ValueError('Expected a current image-only capture')
    if set(capture['webInputs']) != {'image'}:
        raise ValueError('Expected exactly one captured image input')
    raster = capture['raster']
    rgba = np.frombuffer(base64.b64decode(raster['rgbaBase64'], validate=True), dtype=np.uint8)
    rgba = rgba.reshape(raster['height'], raster['width'], 4)
    notebook_path = ROOT / contract['preprocessing']['sourceNotebook']
    notebook = json.loads(notebook_path.read_text(encoding='utf-8'))
    tree = ast.parse(''.join(notebook['cells'][contract['preprocessing']['cell']]['source']))
    nodes = [node for node in tree.body if
             isinstance(node, ast.FunctionDef) and node.name == 'load_image_array' or
             isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id in
             {'IMAGE_PADDING_RATIO', 'INK_THRESHOLD'} for t in node.targets)]
    namespace = {'np': np, 'Image': Image, 'IMG_HEIGHT': 96, 'IMG_WIDTH': 96}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(notebook_path), 'exec'), namespace)
    with tempfile.TemporaryDirectory() as directory:
        png = Path(directory) / 'capture.png'
        Image.fromarray(rgba).save(png)
        expected = namespace['load_image_array'](png).reshape(1, 96, 96, 1)
    actual = np.asarray(capture['webInputs']['image'], dtype=np.float32).reshape(1, 96, 96, 1)
    if not np.isfinite(actual).all():
        raise ValueError('Captured input contains non-finite values')
    difference = np.abs(expected - actual)
    report = {'modelName': contract['modelName'], 'inputNames': ['image_input'],
              'inputShape': list(actual.shape), 'maximumInputDifference': float(difference.max()),
              'preprocessingPassed': bool(np.array_equal(actual, expected))}
    if cpu_replay:
        import onnxruntime as ort
        model = ROOT / 'apps/mobile/public' / contract['modelUrl'].lstrip('/')
        session = ort.InferenceSession(str(model), providers=['CPUExecutionProvider'])
        if [(i.name, i.shape, i.type) for i in session.get_inputs()] != [('image_input', [1,96,96,1], 'tensor(float)')]:
            raise ValueError('Unexpected model input contract')
        output = session.run(None, {'image_input': actual})[0]
        if output.shape != (1,63) or not np.isfinite(output).all():
            raise ValueError('Invalid model output')
        indices = np.argsort(-output[0], kind='stable')[:3]
        report['cpuTop3'] = [{'label': contract['orderedLabels'][int(i)], 'probability': float(output[0,i])} for i in indices]
    print(json.dumps(report, indent=2))
    if not report['preprocessingPassed']:
        raise ValueError('Browser preprocessing differs from training')
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('--cpu-replay', action='store_true')
    args = parser.parse_args()
    compare_notebook(args.capture, args.cpu_replay)
