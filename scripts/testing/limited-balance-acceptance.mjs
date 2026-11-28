import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

export async function verifyLimitedBalance({ev,nav,wait,send,press,testid,ledger,snap,check}){
  for(const t of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1']){
    await ev(`__r(__modules.learner).localLearnerService.completeTopic('${t}')`);
  }
  const route='/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1';
  await nav(route);
  const ids=await ev("__r(__modules.matching).matchingBoards('checkpoint-v1-topic-2-1').flatMap(b=>b.pairs.map(p=>p.id))");
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  for(let pass=0;pass<20;pass++){
    for(const id of ids){
      await wait(`!!document.querySelector('[data-testid=match-source-${id}]')`);
      const before=await ledger();
      await press('Hint · 2 ★');
      if(before.reduce((sum,row)=>sum+row.amount,0)<2){
        await wait("document.body.innerText.includes('You can still finish the activity')");
        await snap('insufficient-stars');await press('Got it');
        assert.deepEqual(await ledger(),before);await testid('match-source-'+id);await testid('baya-drop-target');
        await wait("document.body.innerText.includes('Correct match!')");
        check('Insufficient funds leaves balance intact and allows submission');
        await ev(`__r(__modules.db).getReadyDatabase().then(db=>db.runAsync("UPDATE local_app_state SET state_value='tl' WHERE state_key='interface_language'"))`);
        await nav('/learner/home');await wait("!!document.querySelector('[data-testid=star-wallet-button]')");await testid('star-wallet-button');await wait("document.body.innerText.includes('Kabuuang nakuha')");await snap('tagalog-wallet');check('Offline Tagalog wallet');return;
      }
      await press('Use hint');await press('Got it');await testid('match-source-'+id);await testid('baya-drop-target');await delay(1950);
    }
    await wait("!!document.querySelector('[data-testid=set-result]')");
    if(!pass){await snap('reduced-motion-completion');check('Reduced motion completion',{preference:await ev("matchMedia('(prefers-reduced-motion: reduce)').matches")});}
    await press('RETRY');
  }
  throw Error('Available funds were never exhausted');
}
