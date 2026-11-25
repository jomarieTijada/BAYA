"""Non-destructive researcher recording pipeline. Python: av, numpy, imageio-ffmpeg.
Run audit, benchmark, build, verify in that order; --source supports any archive path.
PyAV exposes libavformat metadata and fully decodes inputs (FFprobe equivalent).
"""
import argparse, csv, hashlib, json, math, os, shutil, subprocess
from pathlib import Path
import av
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/audio'
ASSETS = ROOT / 'apps/mobile/assets/audio/baya'
WORK = ROOT / '.codex-tmp/audio'
EXT = {'.wav', '.mp3', '.m4a', '.aac', '.ogg', '.opus', '.flac', '.webm'}
SETTINGS = 'aac64-mono-48k-peak-limited-gain-v2-no-trim'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name, value): (DOC / name).write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding='utf-8')
def csvfile(name, rows):
    if not rows: return
    with (DOC / name).open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(dict.fromkeys(k for r in rows for k in r)))
        w.writeheader(); w.writerows(rows)
def ffmpeg():
    if os.getenv('FFMPEG'): return os.environ['FFMPEG']
    if shutil.which('ffmpeg'): return shutil.which('ffmpeg')
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()
def command(args):
    p = subprocess.run([ffmpeg(), '-hide_banner', '-nostdin', *args], capture_output=True, text=True)
    if p.returncode: raise RuntimeError(p.stderr[-4000:])
    return p.stderr
def inspect(p):
    with av.open(str(p)) as c:
        s = c.streams.audio[0]
        meta = dict(container=c.format.name, codec=s.codec_context.name, sample_rate=s.rate,
                    channels=s.channels, bitrate=s.bit_rate, bit_depth='N/A (lossy)' if s.codec_context.name in ('aac','opus','mp3') else s.codec_context.format.bits,
                    audio_streams=len(c.streams.audio), tags=json.dumps(c.metadata), duration=float(s.duration*s.time_base) if s.duration else c.duration/1e6)
        for frame in c.decode(s): frame.to_ndarray()  # Verify every packet with libavcodec.
    raw = subprocess.run([ffmpeg(), '-v','error','-i',str(p),'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, meta['channels']).astype(np.float64)
    if not len(x) or not np.isfinite(x).all(): raise ValueError('Empty/nonfinite decoded audio')
    mono = x.mean(axis=1); peak = float(np.max(np.abs(x))); rms = float(np.sqrt(np.mean(x*x)))
    chunk = max(1, meta['sample_rate']//100)
    levels = np.array([np.sqrt(np.mean(mono[i:i+chunk]**2)) for i in range(0,len(mono),chunk)])
    # Descriptive noise/impulse proxies only: quiet speech can occupy these windows.
    # Never use these values to denoise, trim or certify pronunciation.
    quiet_indices=np.flatnonzero(levels <= np.quantile(levels,.2))
    quiet_windows=[mono[i*chunk:min((i+1)*chunk,len(mono))] for i in quiet_indices]
    quiet_rms=float(np.sqrt(np.mean(np.concatenate(quiet_windows)**2)))
    quiet_spectrum=sum((np.abs(np.fft.rfft(w,n=chunk))**2 for w in quiet_windows),start=np.zeros(chunk//2+1))
    quiet_freq=np.fft.rfftfreq(chunk,1/meta['sample_rate'])
    quiet_high=float(quiet_spectrum[quiet_freq>6000].sum()/max(quiet_spectrum.sum(),1e-20))
    steps=np.diff(mono)
    impulses=int(np.sum((np.abs(steps[:-1])>.25)&(np.abs(steps[1:])>.25)&(steps[:-1]*steps[1:]<0)))
    active = np.flatnonzero(levels > 10**(-45/20))
    correlation = float(np.corrcoef(x.T)[0,1]) if x.shape[1]==2 and rms else 1
    mono_loss = 20*math.log10(max(float(np.sqrt(np.mean(mono*mono))),1e-12)/max(rms,1e-12))
    spec = np.abs(np.fft.rfft(mono))**2; freq = np.fft.rfftfreq(len(mono),1/meta['sample_rate'])
    hum = float(spec[((abs(freq-50)<2)|(abs(freq-60)<2))].sum()/max(spec.sum(),1e-20))
    silent = levels < 10**(-45/20); runs=[]; start=None
    for i,v in enumerate([*silent,False]):
        if v and start is None: start=i
        if not v and start is not None: runs.append((start/100,(i-start)/100)); start=None
    loud = command(['-i',str(p),'-af','loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-'])
    measured = json.JSONDecoder().raw_decode(loud[loud.rfind('{'):])[0]
    flags=[]
    if peak >= .999: flags.append('possible clipping')
    if rms < .01: flags.append('low volume')
    if not len(active): flags.append('possible silence')
    if hum > .05: flags.append('possible electrical hum')
    if mono_loss < -1: flags.append('stereo downmix requires review')
    if any(d>1 for _,d in runs): flags.append('long silence/pause; boundaries retained')
    if np.max(np.abs(mono[-min(chunk,len(mono)):])) > .1: flags.append('possible abrupt ending')
    meta.update(decoded_duration=len(mono)/meta['sample_rate'], peak_dbfs=20*math.log10(max(peak,1e-12)), rms_dbfs=20*math.log10(max(rms,1e-12)),
                clipped_samples=int((np.abs(x)>=.999).sum()), leading_silence_s=float(active[0]/100) if len(active) else len(mono)/meta['sample_rate'],
                trailing_silence_s=float((len(levels)-1-active[-1])/100) if len(active) else 0,
                pauses=json.dumps(runs), stereo_correlation=correlation, mono_loss_db=mono_loss, hum_energy_fraction=hum,
                loudness_lufs=measured['input_i'], true_peak_dbtp=measured['input_tp'], quiet_window_rms_dbfs=20*math.log10(max(quiet_rms,1e-12)),
                quiet_high_frequency_fraction=quiet_high, impulse_candidate_count=impulses,max_sample_step=float(np.max(np.abs(steps))),flags='; '.join(flags),
                quality_status='REQUIRES LISTENING REVIEW' if flags else 'ACCEPTABLE', decode='PASS')
    return meta, levels

def audit(source):
    rows=[]; fingerprints={}
    for p in sorted(source.rglob('*')):
        if not p.is_file(): continue
        if p.suffix.lower() not in EXT:
            print('Unsupported, skipped:',p.relative_to(source)); continue
        row=dict(filename=p.name, source=p.relative_to(source).as_posix(), extension=p.suffix, bytes=p.stat().st_size, sha256=sha(p))
        try:
            meta, levels=inspect(p); row.update(meta)
            fingerprints[row['source']]=np.interp(np.linspace(0,1,128),np.linspace(0,1,len(levels)),levels).tolist()
        except Exception as e: row.update(decode='FAIL',quality_status='POTENTIALLY CORRUPTED',flags=str(e))
        rows.append(row); print('Audited',row['source'],flush=True)
    save('inventory.json',rows); csvfile('BAYA_AUDIO_INVENTORY.csv',rows)
    similar=[]
    for i,a in enumerate(rows):
        for b in rows[i+1:]:
            if a['sha256']==b['sha256']: similar.append(dict(a=a['source'],b=b['source'],reason='identical SHA256'))
            elif a['source'] in fingerprints and b['source'] in fingerprints and abs(a['duration']-b['duration'])<.12:
                score=float(np.corrcoef(fingerprints[a['source']],fingerprints[b['source']])[0,1])
                if score>.97: similar.append(dict(a=a['source'],b=b['source'],reason='similar envelope only; not proof of duplicate',score=score))
    save('duplicate-candidates.json',similar)

def mapping():
    rows=[]
    for r in json.loads((DOC/'inventory.json').read_text(encoding='utf-8')):
        relative=Path(r['source']); folder=relative.parent.name; filename=relative.name; stem=relative.stem.lower()
        character=''; confidence='VERIFIED'; note='Filename and vowel folder consistently identify syllable; not linguistic certification.'
        category='syllable'; label=stem.capitalize(); lesson='topic-2-2; topic-3-2'
        bases=['b','d','g','h','k','l','m','n','ng','p','s','t','w','y']
        known={'Vowel': {'a','eoi','oou'}, 'KATINIG': set(bases)-{'d'}|{'dr'}}
        for vowel in 'aeiou': known[vowel]={b+vowel for b in bases if b!='d'}|{'d'+vowel+'r'+vowel}
        if stem not in known.get(folder,set()):
            confidence='UNMAPPED'; category='unknown'; lesson='pending'; note='No approved filename/folder convention; content review required.'
        elif folder=='Vowel':
            character={'a':'a','eoi':'e_i','oou':'o_u'}[stem]; label={'a':'A','eoi':'E / I','oou':'O / U'}[stem]
            category='character'; lesson='topic-2-1; topic-3-1'
            note='Combined vowel filename matches the approved combined character label; use only for whole character, never as isolated contextual vowel.'
        elif folder=='KATINIG':
            confidence='AMBIGUOUS'; category='consonant-review'; label=stem.upper(); lesson='pending'
            note='May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.'
        elif stem in ('dere','diri'):
            character='de_di'; label='De / Re' if stem=='dere' else 'Di / Ri'; lesson='Upper Kudlit'
            note='Combined D/R recording validated by user on 2026-11-25; preserve both spoken syllables.'
        elif stem in ('doro','duru'):
            confidence='AMBIGUOUS'; note='Combined D/R recording; current modified guide labels D only. Confirm intended sequence before assignment.'; lesson='pending'
        elif folder=='a': character='da_ra' if stem=='dara' else stem; label='Da / Ra' if stem=='dara' else label; category='character'
        else:
            base=stem[:-1]; character=base+('e_'+base+'i' if folder in ('e','i') else 'o_'+base+'u')
            lesson='character reference variant; story kudlit example (B only)'
        integrated=confidence=='VERIFIED' and r['decode']=='PASS' and r.get('mono_loss_db',-99)>-1
        rows.append(dict(filename=filename,audio_id='baya-'+folder.lower()+'-'+stem,category=category,character_id=character,
                         syllable_id=stem if category=='syllable' else '',word_id='',lesson=lesson,variant=label,language='fil-PH',source=r['source'],
                         confidence=confidence,verification_source='Source folder/filename convention + baybayinCharactersData.ts + baybayinTracingGuides.ts',notes=note,
                         integration_status='INTEGRATED' if integrated else 'WITHHELD FOR REVIEW'))
    save('mapping.json',rows); csvfile('BAYA_AUDIO_MAPPING.csv',rows)
    return rows

def encode(p, out, codec, rate, gain, original_duration):
    out.parent.mkdir(parents=True,exist_ok=True)
    temp=out.with_name(out.stem+'.partial'+out.suffix)
    with av.open(str(p)) as c: channels=c.streams.audio[0].channels
    downmix='pan=mono|c0=0.5*c0+0.5*c1,' if channels==2 else ''
    if channels>2: raise ValueError('Multichannel recording requires explicit downmix review')
    args=['-y','-i',str(p),'-map','0:a:0','-vn','-map_metadata','-1','-ac','1','-ar','48000','-af',f'{downmix}volume={gain}dB','-c:a',codec,'-b:a',f'{rate}k']
    if codec=='libopus': args+=['-vbr','on','-application','audio']
    else: args+=['-movflags','+faststart']
    try:
        command([*args,str(temp)]); meta,_=inspect(temp)
        if meta['clipped_samples'] or meta['rms_dbfs'] < -65: raise ValueError('Clipped or silent output')
        if abs(meta['decoded_duration']-original_duration)>.08: raise ValueError('Duration changed: '+str(p))
        temp.replace(out)
    finally:
        if temp.exists(): temp.unlink()
    return meta

def build(source, benchmark=False):
    inv=json.loads((DOC/'inventory.json').read_text(encoding='utf-8')); maps=mapping(); reports=[]; entries=[]; reviews=[]
    for r,m in zip(inv,maps):
        if r['decode']!='PASS': continue
        # Static gain only, <= 6dB, true-peak headroom for lossy re-encoding. No compressor or trimming.
        gain=round(min(6,max(-6,-18-float(r['loudness_lufs'])),-2.5-float(r['true_peak_dbtp'])),3)
        candidates=[('libopus',24,'webm'),('libopus',32,'webm'),('libopus',40,'webm'),('aac',48,'m4a'),('aac',64,'m4a')] if benchmark else [('aac',64,'m4a')]
        if not benchmark and m['integration_status']!='INTEGRATED': continue
        for codec,rate,ext in candidates:
            out=(WORK/'benchmark' if benchmark else ASSETS)/(m['audio_id']+(f'-{codec}{rate}' if benchmark else '')+'.'+ext)
            key=hashlib.sha256((r['sha256']+SETTINGS+codec+str(rate)+str(gain)).encode()).hexdigest()
            stamp=WORK/(out.name+'.json'); cached=json.loads(stamp.read_text(encoding='utf-8')) if stamp.exists() else {}
            if out.exists() and cached.get('key')==key and cached.get('sha256')==sha(out): meta=cached['meta']
            else:
                meta=encode(source/r['source'],out,codec,rate,gain,r['decoded_duration'])
                if abs(meta['decoded_duration']-r['decoded_duration'])>.08: raise ValueError('Duration changed: '+r['source'])
                stamp.parent.mkdir(parents=True,exist_ok=True); stamp.write_text(json.dumps(dict(key=key,sha256=sha(out),meta=meta)))
            reports.append(dict(original=r['source'],original_format=r['codec'],original_bytes=r['bytes'],original_duration=r['duration'],optimized=out.relative_to(ROOT).as_posix(),codec=codec,kbps=rate,output_bytes=out.stat().st_size,reduction_percent=round(100*(1-out.stat().st_size/r['bytes']),2),gain_db=gain,decode=meta['decode'],duration_delta_s=meta['decoded_duration']-r['decoded_duration'],peak_dbfs=meta['peak_dbfs'],clipped_samples=meta['clipped_samples'],quality='Human listening pending',reason='Benchmark' if benchmark else 'AAC-LC 64k: conservative speech fidelity, single compatible container; see browser evidence'))
            if not benchmark:
                entries.append(dict(id=m['audio_id'],category=m['category'],characterId=m['character_id'],baseCharacterId='da_ra' if m['syllable_id'] in ('dere','diri') else (m['syllable_id'][:-1]+'a') if m['category']=='syllable' else m['character_id'],syllableId=m['syllable_id'],label=m['variant'],language='fil-PH',durationMs=round(meta['duration']*1000),codec='aac',sourcePath=r['source'],sourceSha256=r['sha256'],sha256=sha(out),version=key,filename=out.name))
                reviews.append(dict(original=r['source'],optimized=out.relative_to(ROOT).as_posix(),intended=m['variant'],duration=meta['duration'],setting=SETTINGS,mapping_confidence=m['confidence'],reviewer_status='PENDING',notes=r['flags']))
        print('Benchmarked' if benchmark else 'Built',r['source'],flush=True)
    csvfile('BAYA_AUDIO_BENCHMARK.csv' if benchmark else 'BAYA_AUDIO_COMPRESSION_REPORT.csv',reports)
    if not benchmark:
        save('manifest.json',entries); csvfile('BAYA_AUDIO_LISTENING_REVIEW.csv',reviews)
        lines=['// Generated by scripts/audio/process_audio.py build. Do not hand-edit.',"import type { AudioSource } from 'expo-audio';",'export interface BayaAudioEntry { id: string; category: string; characterId: string; baseCharacterId: string; syllableId: string; label: string; language: string; durationMs: number; codec: string; sourcePath: string; sourceSha256: string; sha256: string; version: string; source: AudioSource }','export const bayaAudio: readonly BayaAudioEntry[] = [']
        for e in entries:
            filename=e.pop('filename'); lines.append('  { ...'+json.dumps(e)+", source: require('../../assets/audio/baya/"+filename+"') },")
        lines+= ['];','export const characterRecording = (id: string) => bayaAudio.find(entry => entry.characterId === id && entry.category === "character");']
        (ROOT/'apps/mobile/modules/audio/manifest.ts').write_text('\n'.join(lines)+'\n',encoding='utf-8')

def verify(source):
    inv=json.loads((DOC/'inventory.json').read_text(encoding='utf-8')); entries=json.loads((DOC/'manifest.json').read_text(encoding='utf-8')); results=[]
    for r in inv:
        if sha(source/r['source'])!=r['sha256']: raise ValueError('Source changed: '+r['source'])
    for e in entries:
        p=ASSETS/e['filename']; meta,_=inspect(p)
        original=next(r for r in inv if r['source']==e['sourcePath'])
        assert sha(p)==e['sha256'] and meta['codec']=='aac' and meta['channels']==1
        assert abs(meta['decoded_duration']-original['decoded_duration'])<.08 and not meta['clipped_samples']
        assert meta['rms_dbfs']>-65 and abs(meta['leading_silence_s']-original['leading_silence_s'])<.3
        results.append(dict(id=e['id'],checksum='PASS',decode='PASS',duration='PASS',clipping='PASS',silence='PASS'))
    csvfile('BAYA_AUDIO_OUTPUT_VERIFICATION.csv',results); print(f'Verified {len(inv)} unchanged originals and {len(results)} outputs.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('action',choices=['audit','benchmark','build','verify']); parser.add_argument('--source',type=Path,default=ROOT/'sounds'); args=parser.parse_args()
    if not args.source.is_dir(): parser.error('Source directory inaccessible: '+str(args.source))
    DOC.mkdir(parents=True,exist_ok=True); WORK.mkdir(parents=True,exist_ok=True)
    if args.action=='audit': audit(args.source); mapping()
    elif args.action=='verify': verify(args.source)
    else: build(args.source,args.action=='benchmark')
