"""Inventory and copy the approved sources without changing artwork or inputs."""
import csv, hashlib, json, re, shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / 'apps/mobile'
DOC = ROOT / 'docs/animations'
DEST = APP / 'assets/branding/baya/animations/v1.1'
REGISTRY = APP / 'components/branding/baya/frameSources.ts'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def install():
    DOC.mkdir(parents=True, exist_ok=True)
    old = json.loads((ROOT / 'scripts/optimization/mascot-derivatives.json').read_text())
    baseline = DOC / 'previous-assets.json'
    if not baseline.exists():
        baseline.write_text(json.dumps(old, indent=2) + '\n')
    rows, sequences = [], {}
    registry = '// Canonical v1.1 frame order. Web sources are generated from this file.\n'
    for state in ('wave', 'blink'):
        folder = ROOT / f'baya_{state}_new'
        files = list(folder.iterdir())
        assert files and all(re.fullmatch(r'frame-\d+\.png', p.name) for p in files), 'Unexpected source/metadata: inspect before importing'
        files.sort(key=lambda p: int(p.stem.split('-')[-1]))
        indices = [int(p.stem.split('-')[-1]) for p in files]
        assert indices == list(range(indices[0], indices[0] + len(files))), 'Missing source index'
        target = DEST / state
        target.mkdir(parents=True, exist_ok=True)
        seen, frames, sizes = {}, [], set()
        sheet = Image.new('RGB', (1000, ((len(files)+4)//5)*220), '#e9e3d7')
        draw = ImageDraw.Draw(sheet)
        registry += f'export const {state.upper()}_FRAMES: readonly number[] = [\n'
        for i, source in enumerate(files):
            with Image.open(source) as original:
                original.load()
                im = original.convert('RGBA')
                sizes.add(im.size)
                digest = hashlib.sha256(im.tobytes()).hexdigest()
                name = f'frame-{i:03}.png'
                row = dict(source_path=str(source), original_filename=source.name, new_filename=name, sequence=state, frame_index=i, width=im.width, height=im.height, format=original.format, mode=original.mode, alpha_extrema=str(im.getchannel('A').getextrema()), visible_bbox=str(im.getchannel('A').getbbox()), bytes=source.stat().st_size, sha256=sha(source), duplicate_of=seen.get(digest, ''), validation='PASS')
                seen.setdefault(digest, i)
                rows.append(row)
                shutil.copyfile(source, target/name)
                assert sha(source) == sha(target/name)
                frames.append(dict(index=i, file=name, sha256=sha(source)))
                thumb = im.copy(); thumb.thumbnail((200, 200))
                sheet.paste(thumb, ((i%5)*200, (i//5)*220), thumb)
                draw.text(((i%5)*200+5, (i//5)*220+202), f'{state} {i:03}', fill='black')
                registry += f"  require('../../../assets/branding/baya/animations/v1.1/{state}/{name}'),\n"
        assert len(sizes) == 1, 'Inconsistent canvas dimensions'
        registry += '];\n\n'
        sequences[state] = dict(frameCount=len(files), dimensions=list(sizes.pop()), frameDurationMs=60, timingSource='existing application cadence; no supplied timing metadata', loopPolicy='caller-controlled; greeting plays once', staticFrame='blink/frame-000.png', frames=frames)
        sheet.save(DOC/f'{state}-contact-sheet.png')
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST/'manifest.json').write_text(json.dumps(dict(version='v1.1', sequences=sequences), indent=2)+'\n')
    REGISTRY.write_text(registry)
    with (DOC/'BAYA_MASCOT_V1.1_SOURCE_INVENTORY.csv').open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
    print(json.dumps(sequences, indent=2))

if __name__ == '__main__':
    install()
