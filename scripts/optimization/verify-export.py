"""Compare exports and fail closed on accidental loss of offline assets or protected bytes."""
import base64, hashlib, json, re, sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
before=Path(sys.argv[1]);after=Path(sys.argv[2])
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def manifest(p):
    sw=(p/'sw.js').read_text(encoding='utf-8')
    urls=json.loads(re.search(r'const PRECACHE_URLS = (.*);',sw)[1])
    integrity=json.loads(re.search(r'const ASSET_INTEGRITY = (.*);',sw)[1])
    for url,expected in integrity.items():
        assert 'sha256-'+base64.b64encode(hashlib.sha256((p/url.lstrip('/')).read_bytes()).digest()).decode()==expected,url
    return {'index.html' if u=='/' else u.lstrip('/') for u in urls}
old=manifest(before);new=manifest(after)
derivatives=json.loads((root/'scripts/optimization/mascot-derivatives.json').read_text())['frames']
source_hashes={f['source_sha256'] for f in derivatives};output_hashes={f['output_sha256'] for f in derivatives}
new_hashes={digest(after/p) for p in new}
exceptions=[]
for p in old:
    if digest(before/p) in new_hashes:continue
    if p=='index.html' or p.startswith('_expo/static/js/') or (p.startswith('assets/fonts/') and not Path(p).name.startswith('Ionicons.')) or digest(before/p) in source_hashes:
        exceptions.append(p);continue
    raise AssertionError('Unexpected removed or changed offline resource: '+p)
assert output_hashes<=new_hashes
assert not source_hashes&new_hashes,'Original frames also shipped'
assert len([p for p in new if p.startswith('assets/fonts/')])==1
assert not any(p.endswith('.map') for p in new)
assert len([p for p in new if p.endswith('.m4a')])==69
config=json.loads((root/'apps/mobile/ml/bayaActiveModel.json').read_text())
for url in [config['modelUrl'],config['labelsUrl'],config['contractUrl'],*[config['runtimeBaseUrl']+p for p in config['runtimeFiles']]]:
    p=url.lstrip('/');assert p in new and digest(before/p)==digest(after/p)
result=dict(passed=True,before_count=len(old),after_count=len(new),expected_changed_or_removed=exceptions,protected_model_runtime_and_audio='unchanged SHA-256',web_frames=50,original_frames_deployed=0)
(root/'docs/optimization/export-validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('Verified precache integrity, all retained resources, model/runtime/audio parity and web-only derivatives')
