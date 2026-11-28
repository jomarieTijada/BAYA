import fs from 'node:fs';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

export async function verifyLearning({browser,send,ev,nav,click,testid,snap,check,wait,report}){
  async function scenario(name,fn){
    if(process.env.BAYA_ONLY&&!name.includes(process.env.BAYA_ONLY))return;
    if(name.startsWith('Home isolation')&&!process.env.BAYA_ONLY)return;
    try{await fn();check(name)}catch(e){report.errors.push(name+' '+String(e));console.error(name,e);process.exitCode=1}
  }
  const sql=query=>ev(`__r(__modules.db).getReadyDatabase().then(db=>db.getAllAsync(${JSON.stringify(query)}))`);
  const lookup=id=>`__r(__modules.db).getReadyDatabase().then(db=>db.getFirstAsync("SELECT * FROM learner_achievements WHERE achievement_id=?",['${id}']))`;
  const award=async id=>{await wait(lookup(id));check('SQLite unlock '+id,await ev(lookup(id)))};
  const readBook=async()=>{
    await wait(`!!document.querySelector('[data-testid=origin-storybook]')`);
    for(let i=0;i<25;i++){
      const finish=await ev(`!!document.querySelector('[aria-label="Finish Reading"]')`);if(finish){await snap('storybook-final');await click('Finish Reading');return}
      await click('Next');await delay(500);
    }throw Error('Final page unavailable');
  };
  await scenario('Five-page first launch and Settings replay',async()=>{
    await nav('/');await readBook();await award('baya_story_explorer');
    await nav('/learner/achievements');await click('Settings');await testid('storybook-settings-trigger');await readBook();await award('story_revisited');
  });
  await scenario('Home isolation after changing active QA learner',async()=>{
    await nav('/');await readBook();await award('baya_story_explorer');
    await nav('/learner/home');await wait(`document.body.innerText.includes('BAYA Story Explorer')`);await snap('home-first-learner');
    await ev(`__r(__modules.db).getReadyDatabase().then(db=>db.runAsync("DELETE FROM local_app_state WHERE state_key='active_learner_profile_id'"))`);
    const other=await ev(`__r(__modules.learner).localLearnerService.saveProfile('Second isolated learner')`);
    await nav('/learner/home');await wait(`document.body.innerText.includes('Second isolated learner')&&document.body.innerText.includes('No achievements yet')`);
    assert(!(await ev(`document.body.innerText.includes('BAYA Story Explorer')`)));await snap('home-second-learner');
    assert.equal((await sql("SELECT COUNT(*) AS n FROM learner_achievements WHERE learner_id='"+other.profile_id+"'"))[0].n,0);
  });
  await scenario('Persisted LiteRT handwriting from a recorded A trace',async()=>{
    if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width:747,height:274,deviceScaleFactor:1,mobile:false});
    await nav('/learner/activities/topic-3-1');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);
    const r=await ev(`(()=>{const e=document.querySelector('[data-testid=writing-canvas]');e.scrollIntoView({block:'center'});const {x,y,width,height}=e.getBoundingClientRect();return{x,y,width,height}})()`);
    await delay(500);
    const samples=JSON.parse(fs.readFileSync('docs/verification/device-qa-20261114/s23-manual/manual-samples.json','utf8')).filter(s=>s.label==='A');
    const original=samples[0].paths.map(path=>[...path.matchAll(/([QL])([\d., -]+)/g)].map(m=>{const n=m[2].split(/[ ,]+/).filter(Boolean).map(Number);return{x:n[0]/1000,y:n[1]/1000}}));
    const count = async () => (await sql('SELECT COUNT(*) AS n FROM writing_attempts'))[0].n;
    const before=await count();
    assert.equal(await ev(`document.querySelector('[aria-label="Check your writing"]').getAttribute('aria-disabled')`),'true');
    // Wait for shipped inference to initialize, keeping the stored trace at its original scale.
    await ev(`__r(__modules.recognition).recognizeWriting(${JSON.stringify(original)},${JSON.stringify({width:r.width,height:r.height})})`);
    assert.equal(await count(),before);check('Model warmup and empty canvas create no writing attempt');
    async function draw(rect){for(const stroke of original){
      const points=stroke.map(p=>({x:rect.x+rect.width*p.x,y:rect.y+rect.height*p.y}));
      const event=async(type,p)=>browser.physical?send('Input.dispatchTouchEvent',{type:{mousePressed:'touchStart',mouseMoved:'touchMove',mouseReleased:'touchEnd'}[type],touchPoints:type==='mouseReleased'?[]:[p]}):send('Input.dispatchMouseEvent',{type,...p,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:1});
      await event('mousePressed',points[0]);for(const pt of points.slice(1))await event('mouseMoved',pt);await event('mouseReleased',points.at(-1));
    }
    }
    await draw(r);await click('Check your writing');await wait(`!!document.querySelector('[data-testid=baya-predicted-class]')`,90000);await snap('litert-result');
    check('Model output',{rows:await sql("SELECT result_status,recognized_result,confidence_value,scoring_method FROM activity_attempts JOIN writing_attempts USING(attempt_id)")});
    await award('first_stroke');await award('first_recognition');assert.equal(await count(),before+1);
    const successBefore=(await sql("SELECT count(*) AS n FROM activity_attempts WHERE result_status='valid'"))[0].n;
    await nav('/learner/activities/topic-3-2');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);await delay(450);
    const rect=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()`);
    await draw(rect);await click('Check your writing');await wait(`!!document.querySelector('[data-testid=baya-predicted-class]')`,60000);
    const latest=(await sql("SELECT result_status,recognized_result,confidence_value FROM activity_attempts JOIN writing_attempts USING(attempt_id) ORDER BY attempted_at DESC LIMIT 1"))[0];
    assert.equal(latest.result_status,'invalid');assert.equal((await sql("SELECT count(*) AS n FROM activity_attempts WHERE result_status='valid'"))[0].n,successBefore);
    await snap('litert-wrong-target');check('Wrong target saved without increasing correct writing count',latest);
  });
  await scenario('Intentional character selection and natural audio completion',async()=>{
    await nav('/learner/activities/topic-2-2');await wait(`!!document.querySelector('[data-testid^=character-chip-]')`);
    const ids=await ev(`Array.from(document.querySelectorAll('[data-testid^=character-chip-]'),e=>e.dataset.testid)`);assert.equal(ids.length,14);
    for(const [i,id] of ids.entries()){
      await ev(`document.querySelector('[data-testid=${id}]').click()`);await delay(150);
      if(i<2){
        const label=await ev(`Array.from(document.querySelectorAll('[role=button]'),e=>e.getAttribute('aria-label')).find(s=>s&&/pronunciation|pagbigkas/i.test(s))`);
        for(let j=0;j<(i===0?2:1);j++){await click(label);await delay(3500);}
        assert.equal((await sql("SELECT * FROM achievement_events WHERE event_type='audio'")).length,i+1);
      }
      if(i===0){await award('first_feather');await award('first_sound');}
      if(i===6)await award('seven_symbols');
    }
    await award('fourteen_feathers');
  });
  await scenario('Collection filters, details and responsive measurements',async()=>{
    await nav('/learner/achievements');await wait(`document.querySelectorAll('[data-testid^=badge-]').length===50`);
    await ev(`[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Unlocked').click()`);await delay(200);await snap('filter-unlocked');
    await ev(`[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Locked').click()`);await delay(200);await snap('filter-locked');
    await ev(`[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='All').click()`);await delay(200);
    await ev(`document.querySelector('[data-testid=achievement-first_step]').click()`);await wait(`!!document.querySelector('[role=dialog]')`);await snap('details');
    await ev(`[...document.querySelectorAll('[role=dialog] [role=button]')].find(e=>e.textContent==='Close').click()`);await wait(`!document.querySelector('[role=dialog]')`);
    if(process.env.BAYA_TAGALOG){
      await click('Settings');await wait(`!!document.querySelector('[role=radio][aria-label=Tagalog]')`);
      await ev(`document.querySelector('[role=radio][aria-label=Tagalog]').click()`);await delay(350);
      await click('Close settings');await wait(`document.body.innerText.includes('Aking mga Nakamit')`);
    }
    const sizes=browser.physical?[await ev('[innerWidth,innerHeight]')]:[[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900],[1920,1080]];
    for(const [width,height] of sizes){
      if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await delay(300);await snap('grid-'+width+'x'+height);
      const measured=await ev(`Array.from(document.querySelectorAll('[data-testid^=achievement-]'),e=>{const a=e.getBoundingClientRect(),b=e.querySelector('[data-testid^=badge-]').getBoundingClientRect();return {id:e.dataset.testid,centerError:Math.abs((a.left+a.right-b.left-b.right)/2),width:b.width,height:b.height,offset:b.y-a.y}})`);report.checks.push({name:'Geometry '+width+'x'+height,measured});
      assert.equal(measured.length,50);assert(measured.every(m=>m.centerError<1&&m.width===80&&m.height===80));
    }
    if(process.env.BAYA_TEXT_SCALE){
      const reply=await send('Emulation.setEmulatedOSTextScale',{scale:1.5});
      if(reply.error)throw Error(reply.error.message);
      // Some browsers only expose the OS multiplier for text authored with env(preferred-text-scale).
      const scale=await ev(`(()=>{const e=document.createElement('span');e.style.fontSize='calc(10px * env(preferred-text-scale, 1))';document.body.append(e);const v=getComputedStyle(e).fontSize;e.remove();return v})()`);
      check('Browser OS text scale requested',{reference:scale});
      await snap('os-text-scale');await send('Emulation.setEmulatedOSTextScale',{scale:1});
    }
    const last=await ev(`(async()=>{const e=[...document.querySelectorAll('[data-testid^=achievement-]')].at(-1);e.scrollIntoView({block:'end'});await new Promise(r=>setTimeout(r,400));const b=e.getBoundingClientRect();return {bottom:b.bottom,height:innerHeight,visible:e.contains(document.elementFromPoint(b.x+b.width/2,b.bottom-3))}})()`);assert(last.visible);await snap('final-row');check('Final card above navigation',last);
  });
}
