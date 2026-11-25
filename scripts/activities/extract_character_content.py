"""Reproducible OOXML import. No Word automation or third-party parser required."""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as E

ROOT = Path(__file__).resolve().parents[2]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'


def paragraph(p):
    runs = []
    for r in p.findall('.//w:r', NS):
        props = r.find('w:rPr', NS)
        u = r.find('w:rPr/w:u', NS)
        runs.append({'text': ''.join(t.text or '' for t in r.findall('w:t', NS)),
                     'underline': u is not None and u.get(W + 'val') not in ('none', '0', 'false'),
                     'propertiesXml': E.tostring(props, encoding='unicode') if props is not None else None})
    return {'text': ''.join(r['text'] for r in runs), 'runs': runs,
            'propertiesXml': E.tostring(p.find('w:pPr', NS), encoding='unicode') if p.find('w:pPr', NS) is not None else None}


def extract(source):
    with zipfile.ZipFile(source) as z:
        body = E.fromstring(z.read('word/document.xml')).find('w:body', NS)
        blocks = []
        for el in body:
            if el.tag == W + 'p':
                blocks.append({'kind': 'paragraph', **paragraph(el)})
            elif el.tag == W + 'tbl':
                blocks.append({'kind': 'table', 'rows': [[
                    {'text': '\n'.join(paragraph(p)['text'] for p in c.findall('w:p', NS)),
                     'paragraphs': [paragraph(p) for p in c.findall('w:p', NS)]}
                    for c in r.findall('w:tc', NS)] for r in el.findall('w:tr', NS)]})
        supplemental = {n: z.read(n).decode('utf-8') for n in z.namelist()
                        if n in ('word/styles.xml', 'word/numbering.xml', 'word/footnotes.xml', 'word/endnotes.xml', 'word/comments.xml')}
    return {'source': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'blocks': blocks, 'supplemental': supplemental}


def questions(extracted):
    activities = []
    activity = None
    group = None
    for b in extracted['blocks']:
        if b['kind'] == 'paragraph':
            t = b['text'].strip()
            m = re.match(r'ACTIVITY (\d+):\s*(.*)', t)
            if m:
                n = int(m[1])
                activity = {'id': f'character-{n}', 'number': n, 'title': m[2], 'sets': []} if n <= 4 else None
                if activity:
                    activities.append(activity)
            elif activity and t.startswith('SET '):
                n = len(activity['sets']) + 1
                group = {'id': f"{activity['id']}-set-{n}", 'number': n, 'title': t, 'questions': []}
                activity['sets'].append(group)
            elif activity and t.startswith('Instruction:'):
                activity['sourceInstruction'] = t.removeprefix('Instruction:').strip()
        elif activity and group:
            for row in b['rows']:
                cells = [c['text'].strip() for c in row]
                if not cells[0].isdigit():
                    continue
                n = int(cells[0])
                q = {'id': f"{activity['id']}-q-{n:02d}", 'number': n, 'setId': group['id'], 'prompt': cells[1]}
                if activity['number'] == 4:
                    runs = [r for p in row[1]['paragraphs'] for r in p['runs'] if r['text']]
                    start = next(i for i, r in enumerate(runs) if r['underline'])
                    end = max(i for i, r in enumerate(runs) if r['underline']) + 1
                    assert all(r['underline'] for r in runs[start:end])
                    q.update(type='handwriting', prefix=''.join(r['text'] for r in runs[:start]),
                             target=''.join(r['text'] for r in runs[start:end]), suffix=''.join(r['text'] for r in runs[end:]), expectedGlyph=cells[3])
                    assert q['prefix'] + q['target'] + q['suffix'] == q['prompt'] and q['target'] == cells[2]
                else:
                    q.update(type='multiple-choice', options=[{'id': f"{q['id']}-{letter}", 'letter': letter, 'label': label} for letter, label in zip('ABC', cells[2:5])], correctLetter=cells[5][0], sourceAnswer=cells[5])
                    if '—' in cells[5]:
                        assert cells[5].split('—')[1].strip().rstrip('*') == q['options']['ABC'.index(q['correctLetter'])]['label']
                group['questions'].append(q)
    assert len(activities) == 4
    for a in activities:
        assert len(a['sets']) == 5 and all(len(s['questions']) == 5 for s in a['sets'])
        assert [q['number'] for s in a['sets'] for q in s['questions']] == list(range(1, 26))
    return activities


if __name__ == '__main__':
    source = Path(sys.argv[1])
    raw = extract(source)
    data = questions(raw)
    out = ROOT / 'docs/activities'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'source-extraction.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding='utf-8')
    target = ROOT / 'apps/mobile/content/characterActivities'
    target.mkdir(parents=True, exist_ok=True)
    (target / 'questions.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    inventory = ['# Character Level question inventory', '', f"Source SHA-256: `{raw['sha256']}`", '']
    for a in data:
        inventory += [f"## {a['title']}", '', a['sourceInstruction'], '']
        for s in a['sets']:
            inventory += [f"### {s['title']}", '', '| ID | Prompt | A | B | C | Answer / underlined target |', '|---|---|---|---|---|---|']
            for q in s['questions']:
                opts = [o['label'] for o in q.get('options', [])] or ['', '', '']
                answer = q.get('sourceAnswer', q.get('target', '') + ' → ' + q.get('expectedGlyph', ''))
                inventory.append('| ' + ' | '.join([q['id'], q['prompt'], *opts, answer]) + ' |')
            inventory.append('')
    (out / 'CHARACTER_LEVEL_QUESTION_INVENTORY.md').write_text('\n'.join(inventory), encoding='utf-8')
    print('Extracted complete document and verified 4 activities, 20 sets, 100 questions, 25 underline ranges.')
