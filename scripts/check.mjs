import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { projectRoot, isWithin } from './serve.mjs';

export async function staticFiles(root, { hostingFiles = false } = {}) {
  const files = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) throw new Error('Unapproved static path');
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && (/\.(?:html|css|mjs|js|json|txt|xml|svg|ico)$/u.test(entry.name) || hostingFiles && dir === root && ['_headers', '_redirects'].includes(entry.name))) files.push(target);
      else throw new Error('Unapproved static file');
    }
  }
  await visit(root);
  return files.sort();
}

export async function checkSources(root = projectRoot) {
  const publicRoot = path.join(root, 'public');
  const files = await staticFiles(publicRoot);
  for (const name of ['index.html', 'en/index.html', '404.html', 'en/404.html', 'favicon.svg', 'styles/tokens.css', 'styles/app.css', 'js/app.mjs', 'js/locales.mjs', 'js/worker.mjs', 'js/core/lines.mjs', 'js/core/diff.mjs', 'js/core/session.mjs', 'js/core/report.mjs']) {
    if (!files.includes(path.join(publicRoot, name))) throw new Error(`Missing scaffold: ${name}`);
  }
  const verifyReference = async (from, ref) => {
    if (!ref.startsWith('./') && !ref.startsWith('../') && !ref.startsWith('/') && !/^[\w-]/u.test(ref)) throw new Error('Unapproved resource reference');
    if (ref.startsWith('//')) throw new Error('External resource reference');
    if (/[:?#\\]/u.test(ref)) throw new Error('Nonlocal resource reference');
    const target = ref.startsWith('/') ? path.resolve(publicRoot, `.${ref}`) : path.resolve(path.dirname(from), ref);
    if (!isWithin(publicRoot, target) || !files.includes(target) || (await lstat(target)).isSymbolicLink()) throw new Error('Missing or unsafe resource');
  };
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (/\.(?:mjs|js)$/u.test(file)) {
      const syntax = spawnSync(process.execPath, ['--check', file], { shell: false, encoding: 'utf8' });
      if (syntax.status !== 0) throw new Error('JavaScript syntax failed');
      if (/\b(?:eval\s*\(|new\s+Function\b|innerHTML|outerHTML|insertAdjacentHTML|document\.write|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|serviceWorker|clipboard|console\.)/u.test(source)) throw new Error('Forbidden browser API');
      for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|new\s+URL\(\s*)['"]([^'"]+)['"]/gu)) await verifyReference(file, match[1]);
    }
    if (file.endsWith('.html')) {
      if (!/<html\b[^>]*\blang=/u.test(source) || !/<title>/u.test(source) || !/<h1[ >]/u.test(source)) throw new Error('Missing document semantics');
      if (/\bon\w+\s*=|<script\b(?![^>]*\bsrc=)/iu.test(source)) throw new Error('Inline script prohibited');
      for (const tag of source.matchAll(/<(?:script|link|img)\b[^>]*>/gu)) {
        if (/rel="(?:canonical|alternate)"/u.test(tag[0])) continue;
        const ref = tag[0].match(/(?:src|href)="([^"]+)"/u);
        if (ref) await verifyReference(file, ref[1]);
      }
    }
    if (file.endsWith('.css') && /@import|url\(\s*['"]?(?:https?:|\/\/|data:)/iu.test(source)) throw new Error('External CSS resource');
  }
  for (const dir of ['scripts', 'test']) {
    for (const name of await readdir(path.join(root, dir))) if (name.endsWith('.mjs')) {
      const result = spawnSync(process.execPath, ['--check', path.join(root, dir, name)], { shell: false, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`Syntax failed in ${dir}`);
    }
  }
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (Object.keys(pkg.dependencies ?? {}).length || Object.keys(pkg.devDependencies ?? {}).length) throw new Error('Dependencies need separate approval');
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(`PASS: ${ (await checkSources()).length } static files, syntax and resource boundaries. Review DOM/data flow in browser acceptance.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
