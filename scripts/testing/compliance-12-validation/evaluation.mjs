import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const categories = ['valid', 'imperfect-recognizable', 'incomplete', 'random-scribble', 'unrelated-shape'];
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const requireValue = (ok, message) => { if (!ok) throw Error(message); };

// Declarations are auditable prerequisites, not proof that human review occurred.
export function validateManifest(manifest, base, labels) {
  requireValue(manifest.version === 1 && manifest.purpose === 'independent-validation', 'Expected independent-validation manifest v1');
  requireValue(manifest.labelingBeforeInference === true && manifest.independentReview === true, 'Independent blinded labels must precede inference');
  requireValue(Array.isArray(manifest.records) && manifest.records.length > 0, 'No real reviewed samples supplied');
  const ids = new Set(), groups = new Map(), hashes = new Set();
  const rows = manifest.records.map(record => {
    requireValue(record.id && !ids.has(record.id), 'Duplicate/missing sample id'); ids.add(record.id);
    requireValue(['calibration', 'holdout'].includes(record.split), 'Explicit calibration/holdout split required');
    requireValue(categories.includes(record.category), 'Unknown category');
    requireValue(typeof record.valid === 'boolean', 'Independent validity label required');
    requireValue(record.valid === ['valid', 'imperfect-recognizable'].includes(record.category), 'Category/validity labels conflict');
    requireValue(!record.valid || labels.includes(record.trueLabel), 'Valid samples require a canonical ground-truth class');
    requireValue(labels.includes(record.target), 'Predeclared lesson target required; do not substitute model prediction');
    requireValue(record.reviewers?.length >= 2 && new Set(record.reviewers).size >= 2 && record.adjudicated === true, 'Two independent reviewers and adjudication required');
    requireValue(record.provenance && record.authorization && record.trainingExcluded === true, 'Provenance, authorization and training exclusion required');
    for (const key of ['writerId', 'sourceGroup', 'duplicateFamily']) {
      requireValue(typeof record[key] === 'string' && record[key].trim().length > 0, `Missing ${key}`);
      const group = key + ':' + record[key];
      requireValue(!groups.has(group) || groups.get(group) === record.split, `Cross-split ${key} leakage`);
      groups.set(group, record.split);
    }
    requireValue(['image', 'strokes'].includes(record.kind), 'Expected image or strokes input');
    const file = path.resolve(base, record.file || '');
    requireValue(fs.statSync(file).isFile(), 'Input file unavailable');
    const bytes = fs.readFileSync(file), digest = sha256(bytes);
    requireValue(record.sha256 === digest, 'Input hash mismatch');
    requireValue(!hashes.has(digest), 'Duplicate input bytes'); hashes.add(digest);
    return { ...record, file, sha256: digest, payload: record.kind === 'strokes' ? JSON.parse(bytes) : undefined };
  });
  requireValue(rows.some(r => r.split === 'calibration') && rows.some(r => r.split === 'holdout'), 'Both partitions required');
  return rows;
}
const rate = (rows, predicate) => ({ numerator: rows.filter(predicate).length, denominator: rows.length, rate: rows.length ? rows.filter(predicate).length / rows.length : null });
export function metrics(rows) {
  const scored = rows.filter(r => ['pass','review','reject'].includes(r.band));
  const invalid = scored.filter(r => r.valid === false), valid = scored.filter(r => r.valid === true);
  const allInvalid = rows.filter(r => r.valid === false);
  const mastery = allInvalid.filter(r => typeof r.masteryWithoutGate === 'boolean');
  return {
    samples: rows.length,
    notScored: rows.length - scored.length,
    invalidInputAcceptance: rate(invalid, r => r.band === 'pass'),
    validInputHardRejection: rate(valid, r => r.band === 'reject'),
    validInputNonPass: rate(valid, r => r.band !== 'pass'),
    validInputReview: rate(valid, r => r.band === 'review'),
    targetConditionedFalseMasteryWithoutGate: rate(mastery, r => r.masteryWithoutGate),
    targetConditionedFalseMasteryWithResearchGate: rate(mastery, r => r.masteryWithGate),
    masteryUnmeasurableWithoutStrokeCapture: allInvalid.length - mastery.length,
    validCharacterAccuracy: rate(valid, r => r.top?.label === r.trueLabel),
  };
}
export function summarize(rows) {
  return Object.fromEntries(['calibration', 'holdout'].map(split => {
    const partition = rows.filter(r => r.split === split);
    return [split, { overall: metrics(partition), targets: Object.fromEntries([...new Set(partition.map(r => r.target))].map(target => [target, metrics(partition.filter(r => r.target === target))])), categories: Object.fromEntries(categories.map(category => [category, metrics(partition.filter(r => r.category === category))])) }];
  }));
}
