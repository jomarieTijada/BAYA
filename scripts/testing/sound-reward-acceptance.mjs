import assert from 'node:assert/strict';

export async function verifySoundRewards({ev,nav,wait,press,ledger,snap,check,browser,send}) {
  for(const t of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1','topic-2-2','topic-kudlit-upper','topic-kudlit-lower']){
    await ev(`__r(__modules.learner).localLearnerService.completeTopic('${t}')`);
  }
  const set=await ev(`['topic-2-2','topic-kudlit-upper','topic-kudlit-lower'].map(t=>'checkpoint-v1-'+t).find(id=>{const p=__r(__modules.matching).matchingBoards(id)[0].pairs[0];return p.interaction===1&&!p.pending})`);
  assert(set,'Published checkpoint beginning with an approved sound question');
  await nav('/learner/character-activities?checkpointId='+set);
  await wait("!!document.querySelector('[aria-label^=\"Play sound\"]')");
  const label=await ev("document.querySelector('[aria-label^=\"Play sound\"]').getAttribute('aria-label')");
  const before=await ledger();
  for(let i=0;i<2;i++){await press(label);await wait("window.__audio.some(a=>a.currentTime>0)");await wait("window.__audio.every(a=>a.paused||a.ended)");}
  assert.deepEqual((await ledger()).filter(row=>row.amount<0),before.filter(row=>row.amount<0));check('Replayed downloaded approved sound twice without debit');
  await press('Hint · 2 ★');await wait("!!document.querySelector('[aria-label=\"Use hint\"]')");
  await ev("(()=>{const b=document.querySelector('[aria-label=\"Use hint\"]');b.click();b.click()})()");
  await press('Got it');
  const after=await ledger();assert.equal(after.filter(r=>r.kind==='hint').length,1);
  const results=await ev(`(async()=>{const a=await __r(__modules.assessment).characterActivityService.begin('${set}');const q=__r(__modules.matching).matchingBoards('${set}')[0].pairs[0].id; const h=__r(__modules.rewardHints);return Promise.all([h.redeemHint(a,q),h.redeemHint(a,q)])})()`);
  assert.deepEqual(results[0],results[1]);assert.deepEqual(await ledger(),after);await press('View hint');await snap('sound-hint');
  check('Double confirmation and overlapping redemptions return one saved sound hint',{hint:results[0]});
  if(browser.physical){
    await press('Got it');
    const id=await ev(`__r(__modules.matching).matchingBoards('${set}')[0].pairs[0].id`);
    const points=await ev(`(()=>{const source=document.querySelector('[data-testid=match-source-${id}]');const rect=source.getBoundingClientRect(),target=document.querySelector('[data-testid=baya-drop-target]').getBoundingClientRect();for(let y=Math.max(0,rect.top)+4;y<Math.min(innerHeight,rect.bottom)-2;y+=4){for(let x=Math.max(0,rect.left)+4;x<Math.min(innerWidth,rect.right)-2;x+=4){if(source.contains(document.elementFromPoint(x,y)))return [{x,y},{x:target.left+target.width*.5,y:target.top+target.height*.5}]}}})()`);
    assert(points,'Card has a visible draggable surface');
    const [a,b]=points;await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
    for(let step=1;step<=20;step++)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(b.x-a.x)*step/20,y:a.y+(b.y-a.y)*step/20}]});
    await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await wait("document.body.innerText.includes('Correct match!')");await snap('physical-drag');check('Completed assisted sound match with a physical touch drag');
  }

}
