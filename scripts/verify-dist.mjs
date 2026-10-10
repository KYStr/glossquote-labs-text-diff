import { readFile, realpath, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareBundle, parseBuildOptions } from './release.mjs';
import { staticFiles } from './check.mjs';
import { projectRoot } from './serve.mjs';

export async function verifyDist(options = {}) {
  const root = path.join(projectRoot, 'dist');
  if ((await lstat(root)).isSymbolicLink() || await realpath(root) !== root) throw new Error('Unsafe dist');
  const expected = await prepareBundle(options);
  const files = await staticFiles(root, { hostingFiles: true });
  const names = files.map(file => path.relative(root, file).split(path.sep).join('/')).sort();
  if (names.join('\n') !== [...expected.keys()].sort().join('\n')) throw new Error('Build allowlist mismatch');
  const hashes = [];
  for (const name of names) {
    const bytes = await readFile(path.join(root, name));
    if (!bytes.equals(expected.get(name))) throw new Error(`Built content differs: ${name}`);
    hashes.push({ file: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return { status: 'PASS', mode: options.release ? 'release-candidate-not-deployed' : 'preview-noindex', files: hashes };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await verifyDist(parseBuildOptions(process.argv.slice(2))), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
