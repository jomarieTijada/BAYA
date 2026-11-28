import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';

export async function verifyWritingRewards({ledger,nav,ev,wait,send,press,click,snap,check,browser}) {
  const samples=JSON.parse(fs.readFileSync('docs/verification/device-qa-20261114/s23-manual/manual-samples.json','utf8'));
  const trace=samples.find(s=>s.label==='BA'&&s.paths);
  const strokes=trace.paths.map(path=>[...path.matchAll(/([QL])([\d., -]+)/g)].map(m=>{
    const [x,y]=m[2].trim().split(/[ ,]+/).map(Number);
    return {x:x/1000,y:y/1000};
  }));
  const topics=['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1','topic-2-2','topic-kudlit-upper','topic-kudlit-lower','topic-3-1','topic-3-2'];
  for(const id of topics)await ev(`__r(__modules.learner).localLearnerService.completeTopic(${JSON.stringify(id)})`);
  check('Prerequisite fixture completed through the topic service');
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-3-2');
  await wait("!!document.querySelector('[data-testid=writing-canvas]')");
  await press('Hint · 2 ★');await press('Use hint');await press('Got it');await press('View hint');await snap('writing-hint');await press('Got it');
  for(let i=0;i<25;i++){
    await wait("!!document.querySelector('[data-testid=writing-canvas]')&&!document.querySelector('[data-testid=answer-feedback]')");
    const rect=await ev("(()=>{const e=document.querySelector('[data-testid=writing-canvas]');e.scrollIntoView({block:'center'});const {x,y,width,height}=e.getBoundingClientRect();return{x,y,width,height}})()");
    if(!i)await ev(`__r(__modules.recognition).recognizeWriting(${JSON.stringify(strokes)},${JSON.stringify(rect)})`);
    for(const stroke of strokes){
      const pts=stroke.map(p=>({x:rect.x+p.x*rect.width,y:rect.y+p.y*rect.height}));
      const event=(phase,p)=>browser.physical?send('Input.dispatchTouchEvent',{type:['touchStart','touchMove','touchEnd'][phase],touchPoints:phase===2?[]:[p]}):send('Input.dispatchMouseEvent',{type:['mousePressed','mouseMoved','mouseReleased'][phase],...p,button:'left',buttons:phase===2?0:1,clickCount:1});
      await event(0,pts[0]);for(const p of pts.slice(1))await event(1,p);await event(2,pts.at(-1));
    }
    await click('Check Writing');await wait("!!document.querySelector('[data-testid=answer-feedback]')",60000);
    if(!i)await snap('writing-feedback');
    await click('Next');await delay(100);
  }
  await wait("!!document.querySelector('[data-testid=set-result]')");await snap('writing-completion');
  await press('BACK');await wait("location.pathname.includes('/learner/lessons')");
  const transactions=await ledger();
  assert(transactions.some(t=>t.kind==='writing'));assert.equal(transactions.filter(t=>t.kind==='hint').length,1);
  check('25 canvas submissions, writing credit, saved assistance and return to lessons',{transactions});
}
