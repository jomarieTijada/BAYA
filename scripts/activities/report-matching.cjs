const fs = require('fs'), path = require('path'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
for(const ext of ['.png','.webp','.mp3','.wav','.m4a']) require.extensions[ext] = (m,f) => {m.exports=f;};
const root = path.resolve(__dirname,'../..');
const {matchingBoards,matchingPairs} = require(root+'/apps/mobile/content/characterActivities/matching.ts');
const {questionPlacements,topicCheckpoints} = require(root+'/apps/mobile/content/characterActivities/checkpoints.ts');
const boards=topicCheckpoints.flatMap(c=>matchingBoards(c.id));
const quote = v => '"'+String(v).replaceAll('"','""')+'"';
const rows=[['Source activity ID','Source set ID','Source question ID','Educational target','Topic ID','Matching relationship','Matching slide ID','Conversion status','Validation status']];
for(const p of questionPlacements){const pair=matchingPairs.find(x=>x.id===p.questionId), board=boards.find(b=>b.pairs.some(x=>x.id===p.questionId));rows.push([p.sourceActivityId,p.sourceSetId,p.questionId,p.glyph,p.topicId,pair?`${pair.interaction===2?pair.glyph:pair.reading} <-> ${pair.interaction===2?pair.reading:pair.glyph}`:'Handwriting unchanged',board?.id??'',pair?(pair.pending?'Unscored validation notice':'matching-v2'):'Unchanged handwriting',pair?.pending?'Recording awaiting listening validation':'Existing source key retained']);}
const out=root+'/docs/activities/drag-match';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/BAYA_MATCHING_QUESTION_MAPPING.csv','\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\n'));
fs.writeFileSync(out+'/coverage.json',JSON.stringify({sourceQuestions:questionPlacements.length,choiceQuestions:matchingPairs.length,scoreablePairs:matchingPairs.filter(p=>!p.pending).length,pending:matchingPairs.filter(p=>p.pending).map(p=>({id:p.id,prompt:p.reading})),boards:boards.map(b=>({id:b.id,start:b.start,questions:b.pairs.map(p=>p.id),pending:b.pairs[0].pending}))},null,2));
console.log('Mapped',questionPlacements.length,'sources;',boards.length,'boards/notices; pending',matchingPairs.filter(p=>p.pending).map(p=>p.reading));
