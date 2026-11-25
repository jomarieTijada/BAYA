import fs from 'node:fs';
const b='https://baya-baybayin-interactive-learning.netlify.app';const r=await fetch(b+'/models/baya/resnet18-v1/preprocessing.json');fs.writeFileSync('docs/verification/baya-new-features/deployed-preprocessing.json',await r.text());
