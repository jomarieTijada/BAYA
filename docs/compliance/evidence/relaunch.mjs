import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';
const profile=fs.readdirSync(os.tmpdir()).filter(n=>n.startsWith('baya-system-audit-')).map(n=>path.join(os.tmpdir(),n)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0];
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=9368','--headless=new','--disable-gpu',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});console.log(profile);
process.on('exit',()=>child.kill());await new Promise(()=>{});
