import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import { createStaticServer, projectRoot } from '../scripts/serve.mjs';
import { checkSources } from '../scripts/check.mjs';

const request = (port, route, method = 'GET') => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port, path: route, method }, res => {
    let body = '';
    res.setEncoding('utf8'); res.on('data', value => { body += value; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('error', reject); req.end();
});

test('T00 real scaffold, commands and source resources', async () => {
  const pkg = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.private, true); assert.equal(pkg.type, 'module');
  for (const script of ['dev', 'test', 'check', 'build']) assert.ok(pkg.scripts[script]);
  assert.ok((await checkSources()).length >= 4);
  const html = await readFile(path.join(projectRoot, 'public/index.html'), 'utf8');
  assert.match(html, /noindex,nofollow/u);
});

test('T00 loopback, MIME, HEAD, exact routes and traversal rejection', async t => {
  const server = await createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(server.address().address, '127.0.0.1');
  const port = server.address().port;
  const index = await request(port, '/');
  assert.equal(index.status, 200); assert.match(index.headers['content-type'], /^text\/html/u);
  assert.equal(index.headers['x-content-type-options'], 'nosniff');
  assert.equal(index.headers['x-robots-tag'], 'noindex, nofollow');
  assert.match(index.headers['content-security-policy'], /connect-src 'none'/u);
  assert.equal((await request(port, '/', 'HEAD')).body, '');
  assert.equal((await request(port, '/', 'POST')).status, 405);
  for (const route of ['/package.json', '/docs/ENGINEERING.md', '/missing', '/js/']) assert.equal((await request(port, route)).status, 404);
  for (const route of ['/../package.json', '/%2e%2e/package.json', '/.env', '/styles/../index.html']) assert.equal((await request(port, route)).status, 403);
  for (const route of ['/%zz', '/%00', '/%5c..%5cpackage.json', '/C:/Windows']) assert.equal((await request(port, route)).status, 400);
  assert.match((await request(port, '/js/app.mjs')).headers['content-type'], /^text\/javascript/u);
});

test('T00 refuses symlink escape using only synthetic project fixtures', async t => {
  const fixtureParent = path.join(projectRoot, 'test/.tmp');
  await mkdir(fixtureParent, { recursive: true });
  const fixture = await mkdtemp(path.join(fixtureParent, 'serve-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const root = path.join(fixture, 'public'); const outside = path.join(fixture, 'outside');
  await mkdir(root); await mkdir(outside); await writeFile(path.join(outside, 'secret.html'), 'SYNTHETIC');
  await symlink(outside, path.join(root, 'escape'), 'junction');
  const server = await createStaticServer({ root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal((await request(server.address().port, '/escape/secret.html')).status, 403);
});
