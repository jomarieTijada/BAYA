import { createPronunciationController } from '../controller';
import type { PlaybackPhase } from '../types';
import { bayaAudio, characterRecording } from '../manifest';

describe('recorded pronunciation ownership and races', () => {
  function setup() {
    const updates: ((phase: PlaybackPhase) => void)[] = [];
    const releases: jest.Mock[] = [];
    const driver = jest.fn((_source, update) => { updates.push(update); const dispose = jest.fn(); releases.push(dispose); return { dispose }; });
    return { controller: createPronunciationController(driver), driver, updates, releases };
  }
  it('plays on demand, completes and releases', () => {
    const { controller: c, driver, updates, releases } = setup(); const owner = Symbol();
    expect(driver).not.toHaveBeenCalled(); c.play(owner, 'a', 1);
    expect(c.getSnapshot().phase).toBe('loading'); updates[0]('playing'); expect(c.getSnapshot().phase).toBe('playing');
    updates[0]('ready'); expect(c.getSnapshot().phase).toBe('ready'); expect(releases[0]).toHaveBeenCalledTimes(1);
  });
  it('replay and rapid selection release old players and ignore stale completion', () => {
    const { controller: c, updates, releases } = setup(); const owner = Symbol();
    for (let i = 0; i < 30; i++) c.play(owner, String(i), i+1);
    updates[29]('playing'); for (let i = 0; i < 29; i++) { updates[i]('error'); expect(releases[i]).toHaveBeenCalledTimes(1); }
    expect(c.getSnapshot()).toMatchObject({ id: '29', phase: 'playing' }); c.stop(owner);
    expect(releases[29]).toHaveBeenCalledTimes(1);
  });
  it('navigation cleanup cannot stop another mounted control', () => {
    const { controller: c, releases } = setup(); const first=Symbol(), second=Symbol();
    c.play(first,'a',1); c.play(second,'ba',2); c.stop(first);
    expect(releases[1]).not.toHaveBeenCalled(); c.stop(second); expect(releases[1]).toHaveBeenCalledTimes(1);
  });
  it('errors and loading timeout are recoverable without stale playback', () => {
    jest.useFakeTimers(); const { controller: c, updates, releases } = setup(); const owner=Symbol();
    c.play(owner,'missing',1); updates[0]('error'); expect(c.getSnapshot().phase).toBe('error');
    c.play(owner,'slow',2); jest.advanceTimersByTime(15000); expect(c.getSnapshot().phase).toBe('error');
    updates[1]('playing'); expect(c.getSnapshot().phase).toBe('error');
    expect(releases.every(r=>r.mock.calls.length===1)).toBe(true);
    c.play(owner,'a',3); updates[2]('playing'); expect(c.getSnapshot().phase).toBe('playing'); c.stop(); jest.useRealTimers();
  });
  it('handles synchronous failure and synchronous completion without leaking', () => {
    const c=createPronunciationController(()=>{throw Error('unsupported')}); c.play(Symbol(),'a',1); expect(c.getSnapshot().phase).toBe('error');
    const dispose=jest.fn(); const immediate=createPronunciationController((_,update)=>{update('ready');return {dispose};});
    immediate.play(Symbol(),'a',1); expect(dispose).toHaveBeenCalledTimes(1);
  });
});

describe('researcher recording mappings', () => {
  it('has 71 unique, traceable assets with no withheld consonant/combined D-R variants', () => {
    expect(bayaAudio).toHaveLength(71); expect(new Set(bayaAudio.map(e=>e.id)).size).toBe(71);
    expect(bayaAudio.every(e=>e.sourceSha256.length===64 && e.sha256.length===64 && e.durationMs>0)).toBe(true);
    expect(bayaAudio.some(e=>e.sourcePath.startsWith('KATINIG/'))).toBe(false);
    expect(bayaAudio.some(e=>e.id==='baya-e-dere')).toBe(true);
    expect(characterRecording('b')).toBeUndefined();
  });
  it('preserves combined standalone vowels without pretending they are isolated vowels', () => {
    expect(characterRecording('e_i')?.sourcePath).toBe('Vowel/EoI.m4a');
    expect(characterRecording('o_u')?.sourcePath).toBe('Vowel/OoU.m4a');
    expect(characterRecording('e')).toBeUndefined(); expect(characterRecording('u')).toBeUndefined();
  });
  it('keeps separate upper and lower kudlit sounds', () => {
    const variants=bayaAudio.filter(e=>e.baseCharacterId==='ba' && e.category==='syllable');
    expect(variants.map(e=>[e.syllableId,e.characterId])).toEqual([['be','be_bi'],['bi','be_bi'],['bo','bo_bu'],['bu','bo_bu']]);
    expect(new Set(variants.map(e=>e.sha256)).size).toBe(4);
  });
});
