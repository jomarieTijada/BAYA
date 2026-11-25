"""Regenerate measured summaries and the local, offline human A/B listening worksheet."""
import csv, html, json, statistics
from collections import Counter
from pathlib import Path
from urllib.parse import quote
from process_audio import ROOT, DOC, csvfile, SETTINGS

inv=json.loads((DOC/'inventory.json').read_text(encoding='utf-8')); mapping=json.loads((DOC/'mapping.json').read_text(encoding='utf-8')); manifest=json.loads((DOC/'manifest.json').read_text(encoding='utf-8'))
def readcsv(name):
    with (DOC/name).open(encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f))
compression=readcsv('BAYA_AUDIO_COMPRESSION_REPORT.csv'); benchmark=readcsv('BAYA_AUDIO_BENCHMARK.csv')
original=sum(r['bytes'] for r in inv); matched=sum(int(r['original_bytes']) for r in compression); deployed=sum(int(r['output_bytes']) for r in compression)
summary={'recordings':len(inv),'duration_seconds':sum(r['duration'] for r in inv),'original_bytes':original,'integrated':len(manifest),'matched_original_bytes':matched,'deployed_audio_bytes':deployed,'matched_reduction_percent':100*(1-deployed/matched),'archive_to_deployed_reduction_percent':100*(1-deployed/original),'formats':dict(Counter(r['codec'] for r in inv)),'sample_rates':dict(Counter(r['sample_rate'] for r in inv)),'channels':dict(Counter(r['channels'] for r in inv)),'quality':dict(Counter(r['quality_status'] for r in inv)),'unreadable':sum(r['decode']!='PASS' for r in inv)}
trials=[]
for codec,kbps in dict.fromkeys((r['codec'],r['kbps']) for r in benchmark):
    group=[r for r in benchmark if (r['codec'],r['kbps'])==(codec,kbps)]; size=sum(int(r['output_bytes']) for r in group)
    trials.append(dict(codec=codec,kbps=int(kbps),files=len(group),bytes=size,reduction_percent=100*(1-size/original)))
summary['benchmarks']=trials
summary['naming_notes']=['Vowel and KATINIG folder capitalization differs from a/e/i/o/u; source names retained.', 'DaRa/DeRe/DiRi/DoRo/DuRu and DR are combined D/R names; only approved combined base Da/Ra is integrated.', 'No word, narration or feedback labels found.']
summary['withheld_sources']=[m['source'] for m in mapping if m['integration_status']!='INTEGRATED']
summary['exact_duplicates']=sum(r.get('reason')=='identical SHA256' for r in json.loads((DOC/'duplicate-candidates.json').read_text(encoding='utf-8')))
summary['browser_runs']={}
for name in ['chrome','edge']:
    file=DOC/'browser'/f'{name}.json'
    if file.exists():
        run=json.loads(file.read_text(encoding='utf-8')); rows=next((t.get('rows',[]) for t in run['tests'] if t['test']=='all 69 offline decode and playback'),[])
        summary['browser_runs'][name]={'version':run.get('browserVersion',{}).get('product'),'cache_bytes':run.get('cacheBytes'),'tests':[{k:t[k] for k in ('test','status')} for t in run['tests']], 'offline_decode_and_timeline_ms_median':statistics.median(r['loadAndPlayMs'] for r in rows) if rows else None}
(DOC/'summary.json').write_text(json.dumps(summary,indent=2))

review=[]; cards=[]
for r,m in zip(inv,mapping):
    entry=next((e for e in manifest if e['sourcePath']==r['source']),None)
    optimized='apps/mobile/assets/audio/baya/'+entry['filename'] if entry else '.codex-tmp/audio/benchmark/'+m['audio_id']+'-aac64.m4a'
    review.append(dict(original=r['source'],optimized=optimized,intended=m['variant'],character_id=m['character_id'],duration=r['duration'],setting=SETTINGS,mapping_confidence=m['confidence'],integration_status=m['integration_status'],reviewer_status='PENDING',notes=r['flags']+'; '+m['notes']))
    def player(relative): return f'<audio controls preload="none" src="{html.escape(quote("../../"+relative))}"></audio>'
    variants=''.join(f'<div>{codec} {rate} kbps {player(".codex-tmp/audio/benchmark/"+m["audio_id"]+"-"+codec+str(rate)+"."+ext)}</div>' for codec,rate,ext in [('libopus',24,'webm'),('libopus',32,'webm'),('libopus',40,'webm'),('aac',48,'m4a'),('aac',64,'m4a')])
    cards.append(f'<section data-id="{m["audio_id"]}"><h2>{html.escape(m["variant"])} — {html.escape(r["source"])}</h2><p>{html.escape(m["confidence"]+"; "+m["integration_status"])} · {r["duration"]:.3f}s</p><p>{html.escape(m["notes"]+" "+r["flags"])}</p><div>Original {player("sounds/"+r["source"])}</div><div>AAC 64 kbps {player(optimized)}</div><details><summary>Compare all five trial encodings</summary>{variants}</details><label>Reviewer status <select><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>NEEDS NEW RECORDING</option></select></label><label>Reviewer name and notes <textarea></textarea></label></section>')
csvfile('BAYA_AUDIO_LISTENING_REVIEW.csv',review)
(DOC/'listening-review.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BAYA recording review</title><style>body{font:16px system-ui;max-width:1000px;margin:auto;padding:24px;background:#fffaf1;color:#382e25}section{border:1px solid #dfc9ac;border-radius:16px;padding:20px;margin:20px 0}audio{vertical-align:middle;max-width:100%;margin:8px}label{display:block;margin-top:12px}textarea{display:block;width:95%;min-height:50px}button,select{padding:10px}h2{font-size:20px}</style><h1>BAYA researchers' listening review</h1><p>Every status starts PENDING. Filenames establish intended mappings, not linguistic correctness. Compare consonant onsets, vowel identity, final decay, noise and encoding artifacts using headphones. Combined E/I and O/U clips must not be approved as isolated contextual vowels. Consonant-only and modified D/R recordings are withheld pending confirmation. No trimming or denoising was applied. Trial files can be regenerated with the benchmark command.</p><p>Enter the reviewer name and findings, then export the review before closing this page. Nothing is sent to a server.</p><button id="export">Export review JSON</button>'''+''.join(cards)+'''<script>
document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true);
document.querySelector('#export').onclick=()=>{const results=Array.from(document.querySelectorAll('section'),s=>({id:s.dataset.id,status:s.querySelector('select').value,notes:s.querySelector('textarea').value}));const url=URL.createObjectURL(new Blob([JSON.stringify({reviewedAt:new Date().toISOString(),results},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='BAYA-listening-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
</script></html>''',encoding='utf-8')

quality='''# BAYA audio quality and educational review

This is an engineering audit, not linguistic approval. All 87 files still require researcher listening sign-off. Use [the offline A/B worksheet](listening-review.html) and export its reviewer results. No file is marked linguistically validated.

All originals are 48 kHz, stereo AAC in M4A containers and decode successfully. Channels are effectively identical; averaging preserves amplitude. No original crosses the digital-clipping threshold, no file is near-silent, and the measured 50/60 Hz energy does not trigger the hum heuristic. 64 files have silence/pause runs over one second. Their full boundaries remain intact; 23 have no automated technical flags. There are no identical SHA-256 duplicates. Eleven envelope-similarity pairs are listed in duplicate-candidates.json; similar timing is not evidence that the spoken syllables are duplicates.

Signal checks cover duration, peak/RMS, integrated loudness, true peak, silence and pause runs, stereo correlation and downmix loss, hum energy, end-window amplitude, quiet-window RMS/high-frequency energy and short opposite-slope impulse candidates. No impulses cross the conservative sample-step heuristic. The quietest 20% of 10ms windows have RMS between -87.34 and -78.83 dBFS across files. Those windows may contain quiet speech; the measurements do not prove absence of hiss or clicks. Clicks, hiss, speech distortion, truncated phonemes and multiple spoken pronunciations still need listening. No denoising, silence deletion, speed change or pitch change is applied. Static gain is limited to +6 dB and leaves at least 2.5 dB measured source true-peak headroom; the chosen outputs also pass decoded peak checks.

## Withheld mappings

'''
for m in mapping:
    if m['integration_status']!='INTEGRATED': quality+=f'- `{m["source"]}` — {m["notes"]}\n'
quality+='''
## Listening priorities

1. All separate E/I and O/U variants, against their intended spoken vowel.
2. Combined Vowel/EoI, Vowel/OoU and a/DaRa: confirm the complete sequence matches the combined label. These are never substituted for a single contextual sound.
3. All KATINIG recordings: distinguish letter names from vowel-cancelled consonants.
4. DeRe, DiRi, DoRo and DuRu: validate D/R sequence and approved glyph context.
5. Soft consonants, release sounds, the 64 long-pause recordings, and the eleven envelope-similarity pairs.
6. Original versus AAC64, then all five codec trials. Smaller Opus encodings have not been accepted on acoustic evidence alone.

See BAYA_AUDIO_LISTENING_REVIEW.csv for all 87 individual review records, including withheld recordings. Withheld optimized candidates stay in .codex-tmp and are not deployed.
'''
(DOC/'BAYA_AUDIO_QUALITY_REVIEW.md').write_text(quality,encoding='utf-8')

# Chapter III format. Execution evidence is named explicitly; unavailable checks
# are NOT RUN, never inferred from a nearby passing test.
cases=[]
groups={
 'A': [
  ('Correct asset loads','Open each selected asset and decode/play it.','All 69 mapped assets load.', '69 files decoded and advanced media timelines in Chrome and Edge.','PASS'),
  ('Missing asset','Remove a cached vowel recording while offline; press its control.','Recoverable error; lesson remains usable.','Browser cache deletion produced the retry message.','PASS'),
  ('Corrupted asset','Replace cached vowel bytes with invalid media; press its control.','Recoverable error; no synthesized substitution.','Browser invalid-media injection produced the retry message; restoration recovered playback.','PASS'),
  ('Selected format','Play selected AAC64 files and representative five-codec trials.','Selected format actually decodes and plays.','69 selected files and 40 trial files played in each desktop browser.','PASS'),
  ('Repeated loading','Press a pronunciation control 20 times rapidly.','Only one active playback resource.','Browser active-player count was one; unit tests verified 30 selections and disposal.','PASS')],
 'B': [
  ('Vowel','Open Module 2 vowels; activate A, then combined vowel reference.','Correct explicitly mapped recordings.','A played through real lesson controls; E/I played after error restoration; all vowel assets decoded.','PASS'),
  ('Base consonant','Open Module 2 consonants and press BAYA for BA.','BA source plays.','Recorded source URL contains baya-a-ba.','PASS'),
  ('Upper kudlit','Select KA; expand kudlit references; play KE/KI.','Distinct KE/KI assets.','KE control played baya-e-ke; rapid KI playback selected baya-i-ki.','PASS'),
  ('Lower kudlit','Select KA; play KU.','KU asset, not KO or KA.','KU control played baya-u-ku; registry retains separate KO.','PASS'),
  ('Vowel-cancelled forms','Content validator identifies KATINIG clip content.','Only approved consonant-final audio is integrated.','No approved mapping; all 14 KATINIG clips withheld.','NOT RUN — CONTENT REVIEW')],
 'C': [
  ('Play','Press existing lesson pronunciation control.','Playback starts following the press.','Real HTML media timeline advanced after press.','PASS'),
  ('Replay','Activate the recording again.','Playback restarts with one active player.','Repeated control activation passed; controller releases prior resource.','PASS'),
  ('Stop/replace','Switch from BA to KA while BA plays.','Previous sound stops.','No active prior player after character selection.','PASS'),
  ('Rapid selection','Repeat KI control 20 times.','No overlapping or stale playback.','One active player; stale-callback unit tests pass.','PASS'),
  ('Navigation cleanup','Change character/unmount owner; navigate/reload offline.','Prior player releases safely.','Browser character change stopped playback; component unmount tests confirmed removal; offline navigation/reload passed.','PASS')],
 'D': [
  ('English labels','Use English lesson UI and inspect control.','Descriptive English pronunciation label.','English controls used Play <syllable> pronunciation.','PASS'),
  ('Tagalog labels','Choose Tagalog in settings and reopen vowels offline.','Localized label; same recorded pronunciation.','Pakinggan label observed; A recording played offline.','PASS'),
  ('Accessible name','Inspect button semantics, state and selected syllable label.','Button role and meaningful name/state.','Component/browser labels and states verified; real screen reader not tested.','PASS — SEMANTICS ONLY'),
  ('Keyboard/touch targets','Focus BAYA and press Enter; inspect 44px compact controls.','Keyboard activation; touch-friendly controls.','Browser Enter activated playback; code specifies 44px targets; physical touch not tested.','PASS — DESKTOP'),
  ('Error feedback','Inject missing/corrupt media, then restore and retry.','Visible live-region feedback and recovery.','Both injected failures displayed retry text; restored recording played.','PASS')],
 'E': [
  ('Initial caching','Export and wait for BAYA_OFFLINE_STATUS readiness.','All audio present before readiness.','255 required entries; 69 audio files cached.','PASS'),
  ('Offline playback','Disable HTTP cache/network and reject server requests; play all assets.','No pronunciation network dependency.','All 69 decoded/played; only worker-update requests reached blocked server.','PASS'),
  ('Offline replay','Replay lesson pronunciation with network blocked.','Repeat works from cache.','Browser replay and repeated KI requests passed.','PASS'),
  ('Offline navigation','Navigate between consonants and vowels and use kudlit controls.','Lessons render and recorded controls work.','BA, KE, KU, KI and A exercised in offline lessons.','PASS'),
  ('Offline restart','Reload app offline; separately cold-restart browser/OS.','Audio persists across reload and cold restart.','Offline page reload/playback passed; browser-process/OS cold restart not executed.','PARTIAL')],
 'F': [
  ('Output decoding','Run Python verify and browser decoder.','Every selected output decodes.','69 selected outputs passed both independent decoding paths; 435 benchmark outputs decoded in pipeline.','PASS'),
  ('Duration','Compare original/output decoded sample durations.','Difference below 80ms, no timing modification.','All 69 passed; per-file deltas in compression CSV.','PASS'),
  ('Clipping','Inspect decoded sample peaks.','No unexpected digital clipping.','All 69 have zero samples at clipping threshold.','PASS'),
  ('Audible quality','Researcher compares original and optimized recordings.','Intelligible, correct pronunciations without unacceptable artifacts.','87-row A/B worksheet supplied; no human approval claimed.','NOT RUN — LISTENING REVIEW'),
  ('Measured reduction','Sum original and generated file sizes.','Documented savings agree with bytes.','3,458,330 matched source bytes to 1,534,044 output bytes: 55.64% reduction.','PASS')],
 'G': [
  ('Lessons render','Open consonant/vowel lessons and run content/layout suites.','Existing lesson text and images retained.','Real browser lesson controls and existing component/content tests pass.','PASS'),
  ('Handwriting recognition','Run existing ML/writing tests and inspect changed files.','Recognition pipeline unchanged.','Existing ML/writing tests pass; no inference/model source changed. New hardware inference not run.','PASS — REGRESSION SUITE'),
  ('Quiz scoring','Run existing assessment and activity suites.','Scoring and answers unchanged.','Full suite passes; no scoring code changed.','PASS — REGRESSION SUITE'),
  ('Progress persistence','Run existing local/cloud progress tests.','Persistence remains unchanged.','Full suite passes; audio introduces no database/schema/cloud changes.','PASS — REGRESSION SUITE'),
  ('Independent offline learner','Create isolated local learner; navigate/play with network blocked.','Learning audio works without cloud authentication.','Real local profile, offline lesson navigation and audio passed. Workspace-linked setup not retested.','PASS')]
}
for group,items in groups.items():
    for index,(description,steps,expected,actual,status) in enumerate(items,1):
        cases.append({'Test Case ID':f'AUD-{group}{index:02}','Description':description,'Steps':steps,'Expected Results':expected,'Actual Results':actual,'Status':status})
csvfile('BAYA_AUDIO_TEST_CASES.csv',cases)

modified=['apps/mobile/app/_layout.tsx','apps/mobile/components/landing/StorybookVisual.tsx','apps/mobile/components/learner/characters/CharacterViewer.tsx','apps/mobile/components/learner/characters/__tests__/CharacterViewer.test.tsx','apps/mobile/components/learner/characters/useCharacterPronunciation.ts','apps/mobile/components/learner/story/StoryGuide.tsx','apps/mobile/components/learner/story/StoryMascot.tsx','apps/mobile/components/learner/writing/CharacterReferenceCard.tsx','apps/mobile/content/baybayinCharactersData.ts','apps/mobile/jest.setup-media.js','apps/mobile/scripts/generate-pwa-service-worker.mjs','apps/mobile/scripts/__tests__/pwaCache.test.ts']
files=[dict(path=p,change='MODIFIED',notes='Audio-specific edits; existing unrelated edits preserved') for p in modified]
for folder in ['apps/mobile/modules/audio','apps/mobile/assets/audio/baya','scripts/audio','docs/audio']:
    for p in sorted((ROOT/folder).rglob('*')):
        if p.is_file() and '__pycache__' not in p.parts and p.name!='BAYA_AUDIO_FILES.csv': files.append(dict(path=p.relative_to(ROOT).as_posix(),change='CREATED',notes='Generated output' if p.suffix in ('.m4a','.csv','.json','.html','.png') else 'Audio implementation/documentation'))
files.extend([dict(path='docs/BAYA-AUDIO-INTEGRATION.md',change='CREATED',notes='Implementation and limitations'),dict(path='docs/audio/BAYA_AUDIO_FILES.csv',change='CREATED',notes='This inventory')])
csvfile('BAYA_AUDIO_FILES.csv',files)
print(json.dumps(summary,indent=2))
