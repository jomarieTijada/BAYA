import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
export async function verifyRewards({coldRestart,send,ev,wait,click,nav,snap,testid,check,browser}){
  const query=sql=>ev(`__r(__modules.db).getReadyDatabase().then(db=>db.getAllAsync(${JSON.stringify(sql)}))`);
  const ledger=()=>query('SELECT id,kind,source_id,amount,attempt_id FROM learner_star_transactions ORDER BY id');
  const visible=key=>wait(`!!document.querySelector('[data-testid="${key}"]')`);
  const press=async label=>{
    if(!browser.physical)return click(label);
    await wait(`[...document.querySelectorAll('[role=button]')].some(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);
    const point=await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)});if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    assert(point,label);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(300);
  };
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  assert(await ev("fetch('/uncached-proof',{method:'POST'}).then(()=>false,()=>true)"));check('Verified package ready and uncached request failed');
  if(process.env.BAYA_SOUND){
    const {verifySoundRewards}=await import('./sound-reward-acceptance.mjs');
    return verifySoundRewards({ev,nav,wait,press,ledger,snap,check,browser,send});
  }
  if(process.env.BAYA_LOW_FUNDS){
    const {verifyLimitedBalance}=await import('./limited-balance-acceptance.mjs');
    return verifyLimitedBalance({ev,nav,wait,send,press,testid,ledger,snap,check});
  }
  if(process.env.BAYA_WRITING){
    const {verifyWritingRewards}=await import('./writing-reward-acceptance.mjs');
    return verifyWritingRewards({query,ledger,nav,ev,wait,send,press,click,snap,check,browser});
  }
  for(const topic of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1']){
    await nav('/learner/activities/'+topic);
    for(let i=0;i<24;i++){
      if(await ev(`__r(__modules.learner).localLearnerService.getCompletedTopicIds().then(ids=>ids.has('${topic}'))`))break;
      const labels=await ev(`[...document.querySelectorAll('[role=button]')].filter(e=>e.getClientRects().length).map(e=>e.getAttribute('aria-label'))`);
      const next=labels.find(s=>s&&/next|watch the video|return to topics|back to topics|finish|continue|complete|susunod/i.test(s));
      if(next)await click(next);await delay(250);
    }
    assert((await ledger()).some(r=>r.kind==='topic'&&r.source_id===topic));check('Topic reward '+topic);
  }
  await nav('/learner/home');await wait(`document.querySelector('[data-testid=star-wallet-button]')?.textContent.match(/\d+/)`.replace('/d+/','/[0-9]+/'));
  await snap('home-wallet');await testid('star-wallet-button');await wait("document.body.innerText.includes('Recent transactions')");await snap('wallet-history');
  const route='/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1';
  await nav(route);await visible('matching-board');await snap('matching');
  const ids=await ev(`__r(__modules.matching).matchingBoards('checkpoint-v1-topic-2-1').flatMap(b=>b.pairs.map(p=>p.id))`);
  const before=await ledger();await press('Hint · 2 ★');await snap('hint-confirmation');await press('Not now');assert.deepEqual(await ledger(),before);
  await press('Hint · 2 ★');await press('Use hint');await wait("document.body.innerText.includes('Look for this pair')");await snap('matching-clue');await press('Got it');
  await nav(route);await visible('assessment-hint');await press('View hint');await press('Got it');
  check('Offline redemption and restored assistance',{debits:(await ledger()).filter(r=>r.kind==='hint')});
  for(let run=0;run<3;run++){
    for(let i=0;i<ids.length;i++){
      const id=ids[i];await visible('match-source-'+id);
      if(i < 2-run){
        const other=ids.find(x=>x!==id&&ids.indexOf(x)>i);
        if(other){await testid('match-source-'+other);await testid('baya-drop-target');await wait("document.body.innerText.includes('Not quite')");}
      }
      await testid('match-source-'+id);await testid('baya-drop-target');
      await wait("document.body.innerText.includes('Correct match!')");
      if(i===ids.length-1){
        await visible('reward-celebration');
        for(let frame=0;frame<3;frame++)await snap('rating-'+(run+1)+'-frame-'+frame);
      }else await wait(`!document.querySelector('[data-testid=match-source-${id}]')&&!document.body.innerText.includes('Correct match!')`);
    }
    await visible('set-result');await snap('completion-'+(run+1));await press('BACK');await wait("location.pathname.includes('/learner/lessons')");
    await nav(route);await visible('set-result');
    check('Completed real attempt '+(run+1),{rows:await ledger()});
    if(run!==2)await press('RETRY');
  }
  const rows=await ledger();assert.equal(rows.filter(r=>r.kind==='hint').length,1);
  assert.equal(rows.filter(r=>r.kind==='checkpoint').length,1);assert.equal(rows.filter(r=>r.kind==='matching').length,3);
  if(!browser.physical){
    for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await delay(200);await snap('completion-'+width+'x'+height);
      assert(await ev(`[...document.querySelectorAll('[data-testid=completion-actions] [role=button]')].every(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth})`));
    }
  }
  await press('NEXT');await wait("location.pathname.includes('/learner/activities/')");
  await nav('/learner/achievements');await wait("document.body.innerText.includes('Stars earned')");await snap('achievement-stars');
  await nav('/learner/home');await visible('star-wallet-button');await testid('star-wallet-button');await wait("document.body.innerText.includes('Recent transactions')");await snap('offline-wallet-final');
  await coldRestart();await nav('/learner/home');await wait(`document.querySelector('[data-testid=star-wallet-button]')?.textContent.includes('${rows.reduce((sum,r)=>sum+r.amount,0)}')`);assert(await ev('navigator.onLine===false'));await snap('cold-restart-wallet');
  assert.deepEqual(await ledger(),rows);check('Wallet history survives offline reload and review',{balance:rows.reduce((a,r)=>a+r.amount,0)});
}
