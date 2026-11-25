"""Validate approved inputs, canonical copies, lossless derivatives and production cache."""
import csv, hashlib, json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'apps/mobile'
DOC=ROOT/'docs/animations'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rows=list(csv.DictReader((DOC/'BAYA_MASCOT_V1.1_SOURCE_INVENTORY.csv').open()))
manifest=json.loads((APP/'assets/branding/baya/animations/v1.1/manifest.json').read_text())
derivatives=json.loads((ROOT/'scripts/optimization/mascot-derivatives.json').read_text())['frames']
old=json.loads((DOC/'previous-assets.json').read_text())['frames']
for row in rows:
    source=Path(row['source_path'])
    copy=APP/'assets/branding/baya/animations/v1.1'/row['sequence']/row['new_filename']
    assert sha(source)==sha(copy)==row['sha256']
    with Image.open(source) as im: im.load(); assert im.size==(int(row['width']),int(row['height']))
for state,sequence in manifest['sequences'].items():
    assert sequence['frameCount']==len(list((ROOT/f'baya_{state}_new').glob('*.png')))
    assert [f['index'] for f in sequence['frames']]==list(range(sequence['frameCount']))
for frame in derivatives:
    with Image.open(ROOT/frame['source']) as a,Image.open(ROOT/frame['output']) as b:
        assert a.size==b.size and a.convert('RGBA').tobytes()==b.convert('RGBA').tobytes()
for frame in old:
    assert not (ROOT/frame['source']).exists() and not (ROOT/frame['output']).exists()
exported=list((APP/'dist/assets').rglob('*'))
exported=[p for p in exported if p.is_file()]
hashes={sha(p):p for p in exported}
worker=(APP/'dist/sw.js').read_text()
for frame in derivatives:
    assert frame['output_sha256'] in hashes
    exported_path=hashes[frame['output_sha256']]
    assert '/'+exported_path.relative_to(APP/'dist').as_posix() in worker
for frame in old:
    assert frame['source_sha256'] not in hashes and frame['output_sha256'] not in hashes
assert '/baya-web/idle/' not in worker and '/baya-web/expressions/wave/' not in worker
summary=dict(sourceFrames=len(rows),derivativeFrames=len(derivatives),exportedUniqueFrames=len({f['output_sha256'] for f in derivatives}),oldPngBytes=sum(f['original_bytes'] for f in old),oldWebBytes=sum(f['optimized_bytes'] for f in old),newPngBytes=sum(f['original_bytes'] for f in derivatives),newWebBytes=sum(f['optimized_bytes'] for f in derivatives),inputHashesPreserved=True,oldExportHashesAbsent=True,allNewFramesPrecached=True)
(DOC/'asset-verification.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
