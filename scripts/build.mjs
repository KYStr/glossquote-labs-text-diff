import { writeFile, mkdir, rm, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareBundle, parseBuildOptions } from './release.mjs';
import { projectRoot, isWithin } from './serve.mjs';

export async function build(options = {}) {
  const bundle = await prepareBundle(options);
  const root = await realpath(projectRoot);
  const destination = path.join(root, 'dist');
  if (!isWithin(root, destination) || path.relative(root, destination) !== 'dist') throw new Error('Unsafe build destination');
  try {
    const info = await lstat(destination);
    if (!info.isDirectory() || info.isSymbolicLink() || await realpath(destination) !== destination) throw new Error('Unsafe existing dist');
    await rm(destination, { recursive: true });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(destination);
  for (const [name, bytes] of bundle) {
    const target = path.join(destination, name);
    if (!isWithin(destination, target)) throw new Error('Unsafe asset name');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: 'wx' });
  }
  return bundle.size;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const options = parseBuildOptions(process.argv.slice(2)); console.log(`PASS: built ${await build(options)} approved static files in dist (${options.release ? 'release candidate; NOT DEPLOYED' : 'preview noindex'}).`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
