import fs from 'node:fs';
const b='https://baya-baybayin-interactive-learning.netlify.app';const r=await fetch(b+'/models/baya/resnet18-v1/preprocessing.json');fs.writeFileSync('docs/verification/baya-new-features-2026-11-20/deployed-preprocessing.json',await r.text());
