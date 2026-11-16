import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateManifest, metrics, summarize, sha256 } from './evaluation.mjs';

function fixture() {
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'baya-validation-unit-'));
  const records=['calibration','holdout'].map((split,i)=>{
    // Deliberately mock bytes for metadata-validator tests, never evaluation evidence.
    const bytes=Buffer.from('mock input '+i), file=split+'.png';fs.writeFileSync(path.join(base,file),bytes);
    return {id:split,split,category:'valid',valid:true,trueLabel:'ha',target:'ha',reviewers:['reviewer-a','reviewer-b'],adjudicated:true,provenance:'unit fixture',authorization:'unit test',trainingExcluded:true,writerId:split,sourceGroup:split,duplicateFamily:split,kind:'image',file,sha256:sha256(bytes)};
  });
  return {base,manifest:{version:1,purpose:'independent-validation',labelingBeforeInference:true,independentReview:true,records}};
}
function withFixture(fn) {
  const f=fixture();try {fn(f);} finally {
    const resolved=fs.realpathSync(f.base),allowed=fs.realpathSync(os.tmpdir())+path.sep;
    assert.ok(resolved.startsWith(allowed)&&path.basename(resolved).startsWith('baya-validation-unit-'));
    fs.rmSync(resolved,{recursive:true});
  }
}
test('requires independently reviewed labels and both partitions',()=>withFixture(({base,manifest})=>{
  assert.equal(validateManifest(manifest,base,['ha']).length,2);
  assert.throws(()=>validateManifest({...manifest,labelingBeforeInference:false},base,['ha']));
  assert.throws(()=>validateManifest({...manifest,records:manifest.records.slice(0,1)},base,['ha']));
  assert.throws(()=>validateManifest({...manifest,records:[]},base,['ha']));
}));
for(const key of ['writerId','sourceGroup','duplicateFamily'])test('rejects cross-split '+key,()=>withFixture(({base,manifest})=>{
  manifest.records[1][key]=manifest.records[0][key];assert.throws(()=>validateManifest(manifest,base,['ha']),/leakage/);
}));
test('rejects altered images, duplicated IDs, unreviewed and inconsistent labels',()=>withFixture(({base,manifest})=>{
  for(const patch of [{sha256:'wrong'},{id:'calibration'},{reviewers:['one']},{category:'incomplete'},{trueLabel:'unknown'},{target:'unknown'},{trainingExcluded:false}]) {
    assert.throws(()=>validateManifest({...manifest,records:[manifest.records[0],{...manifest.records[1],...patch}]},base,['ha']));
  }
}));
test('reports exact denominators, uncertainty and missing stroke evidence separately',()=>{
  const rows=[
    {valid:false,band:'pass',masteryWithoutGate:true,masteryWithGate:true},
    {valid:false,band:'reject',masteryWithoutGate:true,masteryWithGate:false},
    {valid:false,band:'pass',masteryWithoutGate:null,masteryWithGate:null},
    {valid:true,band:'reject',top:{label:'ha'},trueLabel:'ha'},
    {valid:true,band:'review',top:{label:'a'},trueLabel:'ha'},
    {valid:true,band:'not-evaluated',status:'error'},
  ];
  const result=metrics(rows);
  assert.deepEqual(result.invalidInputAcceptance,{numerator:2,denominator:3,rate:2/3});
  assert.equal(result.validInputHardRejection.rate,.5);assert.equal(result.validInputNonPass.rate,1);
  assert.equal(result.targetConditionedFalseMasteryWithResearchGate.rate,.5);
  assert.equal(result.masteryUnmeasurableWithoutStrokeCapture,1);assert.equal(result.notScored,1);
  assert.equal(metrics([]).invalidInputAcceptance.rate,null);
  assert.equal(summarize([]).holdout.overall.validInputHardRejection.rate,null);
});
