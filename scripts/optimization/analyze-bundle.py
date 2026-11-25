"""Attribute source-map generated character spans (not compressed bytes) to packages.
Run an isolated Expo --source-maps export; never deploy its maps.
"""
import collections, json, sys
from pathlib import Path
alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
def vlq(segment):
    result=[];value=shift=0
    for char in segment:
        digit=alphabet.index(char);value+=(digit&31)<<shift
        if digit&32:shift+=5
        else:result.append(-(value>>1) if value&1 else value>>1);value=shift=0
    return result

rows=collections.defaultdict(lambda:dict(generated_characters=0,sources=set(),original_source_bytes=0))
for p in Path(sys.argv[1]).rglob('*.js.map'):
    data=json.loads(p.read_text(encoding='utf-8'));code=p.with_suffix('').read_text(encoding='utf-8').splitlines()
    sources=data['sources']; owners=[]
    for i,source in enumerate(sources):
        s=source.replace('\\','/');part=s.rsplit('/node_modules/',1)[-1] if '/node_modules/' in s else None
        owner=('/'.join(part.split('/')[:2]) if part.startswith('@') else part.split('/')[0]) if part else 'application/workspace'
        owners.append(owner)
        if source not in rows[owner]['sources']:
            rows[owner]['sources'].add(source);rows[owner]['original_source_bytes']+=len((data.get('sourcesContent',[None]*len(sources))[i] or '').encode('utf-8'))
    source_id=0
    for line_no,line in enumerate(data['mappings'].split(';')):
        column=0;spans=[]
        for segment in filter(None,line.split(',')):
            v=vlq(segment);column+=v[0]
            if len(v)>1:source_id+=v[1]
            spans.append((column,owners[source_id] if len(v)>1 else None))
        for i,(column,owner) in enumerate(spans):
            end=spans[i+1][0] if i+1<len(spans) else len(code[line_no]) if line_no<len(code) else column
            if owner:rows[owner]['generated_characters']+=max(0,end-column)
result=sorted([dict(package=k,**{**v,'sources':len(v['sources'])}) for k,v in rows.items()],key=lambda r:-r['generated_characters'])
Path('docs/optimization/bundle-attribution.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result[:12],indent=2))
