"""Inventory source resources and an actual Expo export; never infer unused from grep alone.
Usage: python scripts/optimization/inventory-assets.py --export PATH --label BASELINE
Requires Pillow; PyAV enriches audio/video metadata when available.
"""
import argparse, collections, csv, gzip, hashlib, json, mimetypes, os, re, subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/optimization'
MEDIA = {'.png','.jpg','.jpeg','.webp','.avif','.svg','.gif','.wav','.mp3','.m4a','.aac','.opus','.ogg','.flac','.ttf','.otf','.woff','.woff2','.mp4','.webm','.wasm','.tflite','.onnx','.json'}

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def category(p):
    ext = p.suffix.lower(); name = p.as_posix()
    if ext == '.tflite': return 'model'
    if '/litert/' in name: return 'litert-runtime'
    if ext in {'.js','.mjs','.cjs'}: return 'javascript'
    if ext == '.css': return 'css'
    if ext in {'.ttf','.otf','.woff','.woff2'}: return 'font'
    if ext in {'.wav','.mp3','.m4a','.aac','.opus','.ogg','.flac'}: return 'audio'
    if ext in {'.mp4','.webm'}: return 'video'
    if ext in {'.png','.jpg','.jpeg','.webp','.avif','.svg','.gif'}:
        return 'animation' if '/branding/baya/' in name or '/branding/baya-web/' in name else 'image'
    return 'other'

def files(root):
    for base, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if not (Path(base)/d).is_symlink())
        for name in sorted(names):
            p = Path(base)/name
            if not p.is_symlink(): yield p

def write_csv(p, rows):
    with p.open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=list(dict.fromkeys(k for r in rows for k in r)))
        w.writeheader()
        w.writerows({k:json.dumps(v) if isinstance(v,(list,dict)) else v for k,v in r.items()} for r in rows)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--export',required=True); ap.add_argument('--label',default='BASELINE'); a=ap.parse_args()
    export=Path(a.export).resolve(); DOC.mkdir(parents=True,exist_ok=True)
    destination=DOC/f'BAYA_ASSET_{a.label}.json'
    if destination.exists(): raise SystemExit(f'Refusing to overwrite snapshot: {destination}')
    sw=(export/'sw.js').read_text(encoding='utf-8')
    urls=json.loads(re.search(r'const PRECACHE_URLS = (.*);',sw)[1])
    cached={'index.html' if u=='/' else u.lstrip('/') for u in urls}
    deployment=[]; hashes=collections.defaultdict(list)
    for p in files(export):
        rel=p.relative_to(export).as_posix(); b=p.read_bytes(); digest=hashlib.sha256(b).hexdigest()
        row=dict(path=rel,category=category(p),raw_bytes=len(b),gzip_estimate_bytes=len(gzip.compress(b,compresslevel=9,mtime=0)),sha256=digest,precache=rel in cached)
        deployment.append(row); hashes[digest].append(row)
    # Literal matches are reference hints, NOT proof of reachability or non-use.
    source_text=[]
    for base,dirs,names in os.walk(ROOT/'apps/mobile'):
        dirs[:]=[d for d in dirs if d not in {'node_modules','.expo','android','ios','assets','public','coverage'} and not d.startswith('dist')]
        for name in names:
            p=Path(base)/name
            if p.suffix in {'.ts','.tsx','.js','.mjs','.cjs','.json','.css'}:
                source_text.append((p.relative_to(ROOT).as_posix(),p.read_text(encoding='utf-8',errors='replace')))
    roots=['apps/mobile/assets','apps/mobile/public','sounds','baybayin_guides_1024','Gavino_Baybayin_PNG','ml']
    inventory=[]
    for folder in roots:
        for p in files(ROOT/folder):
            if p.suffix.lower() not in MEDIA or '.venv' in p.parts or 'node_modules' in p.parts: continue
            rel=p.relative_to(ROOT).as_posix(); digest=sha(p); deployed=hashes.get(digest,[])
            app_asset=folder.startswith('apps/mobile')
            refs=[name for name,text in source_text if (p.name in text and (p.parent.name in text or p.name.endswith('.tflite')))] if app_asset else []
            row=dict(path=rel,type=p.suffix.lower(),mime=mimetypes.guess_type(p.name)[0],category=category(p),raw_bytes=p.stat().st_size,sha256=digest,references=refs,reference_status='literal hints; resolve registries before deletion',production_paths=[r['path'] for r in deployed],generated_bytes=sum(r['raw_bytes'] for r in deployed),offline_bytes=sum(r['raw_bytes'] for r in deployed if r['precache']),essential_offline=any(r['precache'] for r in deployed),optional=bool(deployed) and not any(r['precache'] for r in deployed),apparently_unused='not established' if not deployed else False,suggestion='retain; inspect reachability' if not deployed else 'benchmark lossless compression' if category(p) in {'image','animation'} else 'retain contract')
            try:
                if p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.avif','.gif'}:
                    with Image.open(p) as im:
                        im.load(); gray=im.convert('L').resize((9,8)); px=list(gray.getdata())
                        row.update(width=im.width,height=im.height,mode=im.mode,frames=getattr(im,'n_frames',1),perceptual_dhash=f'{sum((px[y*9+x]>px[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8)):016x}',decode='passed')
                elif p.suffix.lower() in {'.wav','.mp3','.m4a','.aac','.opus','.ogg','.mp4','.webm'}:
                    import av
                    with av.open(str(p)) as c:
                        row['duration_seconds']=c.duration/1e6 if c.duration else None
                        row['codecs']=[s.codec_context.name for s in c.streams]
            except Exception as e: row['inspection_error']=str(e)
            inventory.append(row)
    groups=collections.defaultdict(list)
    for row in inventory: groups[row['sha256']].append(row['path'])
    total=sum(r['raw_bytes'] for r in deployment); summary=[]
    for cat in sorted({r['category'] for r in deployment}):
        rows=[r for r in deployment if r['category']==cat]
        summary.append(dict(category=cat,file_count=len(rows),raw_bytes=sum(r['raw_bytes'] for r in inventory if r['category']==cat and r['path'].startswith('apps/mobile/')),generated_bytes=sum(r['raw_bytes'] for r in rows),gzip_estimate_bytes=sum(r['gzip_estimate_bytes'] for r in rows),download_measured_bytes=None,offline_bytes=sum(r['raw_bytes'] for r in rows if r['precache']),percent_of_export=100*sum(r['raw_bytes'] for r in rows)/total))
    summary.sort(key=lambda r:-r['generated_bytes'])
    # Physical logical byte totals include dependencies, .git, evidence, scratch, and builds separately.
    repository=collections.Counter()
    for p in files(ROOT):
        try: repository[p.relative_to(ROOT).parts[0]]+=p.stat().st_size
        except OSError: pass
    result=dict(revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),export=str(export),measurement_notes='Raw logical file bytes; gzip is a local estimate, NOT measured hosted transfer. Category totals are disjoint; source/export/cache overlap. Repository includes local tools and ignored artifacts.',repository_bytes=sum(repository.values()),repository_by_top_level=dict(repository),source_asset_bytes=sum(r['raw_bytes'] for r in inventory if r['path'].startswith('apps/mobile/')),production_bytes=total,precache_bytes=sum(r['raw_bytes'] for r in deployment if r['precache']),precache_count=len(urls),summary=summary,largest_files=sorted(deployment,key=lambda r:-r['raw_bytes'])[:30],inventory=inventory,deployment=deployment,exact_duplicate_groups=[v for v in groups.values() if len(v)>1],unused_count=None,initial_download_bytes=None,initial_usable_ms=None,offline_ready_ms=None)
    destination.write_text(json.dumps(result,indent=2),encoding='utf-8');write_csv(DOC/f'BAYA_ASSET_{a.label}.csv',inventory);write_csv(DOC/f'BAYA_ASSET_{a.label}_SUMMARY.csv',summary)
    print(json.dumps({k:result[k] for k in ['repository_bytes','source_asset_bytes','production_bytes','precache_bytes','precache_count','summary']},indent=2))

if __name__=='__main__': main()
