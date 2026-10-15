/** Engineering deployment selection: node apps/mobile/scripts/select-baya-model.mjs previous */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const versions = JSON.parse(await readFile(path.join(app, 'ml/bayaModelVersions.json'), 'utf8'));
const version = process.argv[2];
if (!Object.hasOwn(versions, version)) throw new Error(`Choose one of: ${Object.keys(versions).join(', ')}`);
const publicRoot = path.join(app, 'public');
const text = await readFile(path.join(publicRoot, 'models/baya', versions[version]), 'utf8');
const contract = JSON.parse(text);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (hash(await readFile(path.join(publicRoot, contract.modelUrl))) !== contract.onnxSha256) throw new Error('Model SHA-256 mismatch');
if (!contract.parity.conversionParityPassed || contract.classCount !== 63 || new Set(contract.orderedLabels).size !== 63) throw new Error('Unvalidated model contract');
if (version !== 'previous' && (!contract.parity.preprocessingProvenanceConfirmed || !contract.browserParity?.passed)) throw new Error('Preprocessing/browser validation has not passed');
if (version === 'custom-cnn8-1.1' && (!contract.parity.checkerPassed || !contract.applicationValidation?.passed || contract.preprocessingId !== 'ink-square-pillow-v1')) throw new Error('Custom CNN application/PWA activation gates have not passed');
if (contract.labelsUrl) {
  const bytes = await readFile(path.join(publicRoot, contract.labelsUrl));
  if (hash(bytes) !== contract.labelsSha256) throw new Error('Labels SHA-256 mismatch');
  const labels = JSON.parse(bytes);
  if (!contract.orderedLabels.every((label, index) => labels.id_to_label[String(index)] === label && labels.label_to_id[label] === index)) throw new Error('Label order mismatch');
}
if (process.argv.includes('--validate-only')) {
  console.log(`Validated ${version}: ${contract.modelUrl}. Active manifest unchanged.`);
} else {
  await writeFile(path.join(app, 'ml/bayaActiveModel.json'), text);
  console.log(`Selected ${version}: ${contract.modelUrl}. Rebuild the web export before deploying.`);
}
