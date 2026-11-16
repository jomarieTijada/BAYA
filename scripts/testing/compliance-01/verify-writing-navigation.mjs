import fs from 'node:fs';
import {connect,delay} from './cdp.mjs';
const c=await connect();
const report={};
async function waitFor(expression){for(let i=0;i<100;i++){if(await c.evaluate(expression))return;await delay(100);}throw Error('UI did not become ready: '+expression);}
const paths=()=>c.evaluate("[...document.querySelectorAll('[data-testid=writing-canvas] path')].map(p=>p.getAttribute('d'))");
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
 await c.send('Page.navigate',{url:'http://127.0.0.1:5071/learner/activities/topic-3-1'});await delay(500);
 await waitFor("!!document.querySelector('[data-testid=writing-canvas]')");
 const rect=await c.evaluate("(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()");
 const x=rect.x+rect.w*.3,y=rect.y+rect.h*.3;
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
 for(let i=1;i<=12;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+i*4,y:y+i*3,button:'left',buttons:1});
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+48,y:y+36,button:'left',buttons:0,clickCount:1});await delay(300);
 report.before=await paths();if(!report.before.length)throw Error('Test did not draw a stroke');
 await c.evaluate("[...document.querySelectorAll('[role=button]')].filter(e=>['Settings','Mga Setting'].includes(e.getAttribute('aria-label'))).at(-1).click()");await waitFor("!!document.querySelector('[role=radio][aria-label=Tagalog]')");
 await c.evaluate("document.querySelector('[role=radio][aria-label=Tagalog]').click()");await delay(500);
 await c.evaluate("[...document.querySelectorAll('[role=button]')].filter(e=>['Bumalik','Back'].includes(e.getAttribute('aria-label'))).at(-1).click()");
 await waitFor("location.pathname.endsWith('topic-3-1')");await delay(300);
 report.after=await paths();report.route=await c.evaluate('location.pathname');report.language=await c.evaluate('document.documentElement.lang');
 report.preserved=JSON.stringify(report.before)===JSON.stringify(report.after)&&report.language==='tl'&&report.route.endsWith('topic-3-1');
 if(!report.preserved)throw Error('Writing state was not preserved');
}catch(e){report.error=String(e);process.exitCode=1;}finally{fs.writeFileSync('docs/verification/compliance-01/writing-navigation-report.json',JSON.stringify(report,null,2));console.log(report);c.close();}
