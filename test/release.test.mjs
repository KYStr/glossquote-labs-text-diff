import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { messages, interpolate } from '../public/js/locales.mjs';
import { prepareBundle, parseBuildOptions, approvedOrigin } from '../scripts/release.mjs';
import { createStaticServer, projectRoot, securityHeaders } from '../scripts/serve.mjs';

test('T07 locale parity, placeholders and full static bilingual UI', async () => {
  const shape = value => Object.entries(value).flatMap(([key, child]) => typeof child === 'object' ? shape(child).map(path => `${key}.${path}`) : [key]).sort();
  assert.deepEqual(shape(messages['zh-Hant']), shape(messages.en));
  for (const key of ['summary', 'page', 'pageSummary']) assert.deepEqual([...messages['zh-Hant'][key].matchAll(/\{(\w+)\}/gu)].map(m => m[1]).sort(), [...messages.en[key].matchAll(/\{(\w+)\}/gu)].map(m => m[1]).sort());
  assert.equal(interpolate('Page {current} of {total}', { current: 1, total: 3 }), 'Page 1 of 3');
  for (const [locale, page, home] of [['zh-Hant', 'index.html', '/index.html'], ['en', 'en/index.html', '/en/index.html']]) {
    const html = await readFile(path.join(projectRoot, 'public', page), 'utf8');
    assert.match(html, new RegExp(`<html lang="${locale}">`, 'u'));
    assert.equal((html.match(/<h1>/gu) ?? []).length, 1); assert.equal((html.match(/<h3>/gu) ?? []).length, 4);
    assert.ok(html.includes(`https://glossquote.com${home}`)); assert.ok(html.includes('131,072')); assert.ok(html.includes('8,192')); assert.ok(html.includes('512 KiB'));
    for (const id of ['left', 'right', 'swap', 'compare', 'cancel', 'clear', 'download', 'previous', 'next', 'status', 'error']) assert.ok(html.includes(`id="${id}"`));
    assert.match(html, /content="noindex,nofollow"/u); assert.ok(!html.includes('rel="canonical"'));
  }
});
test('T07 preview and release artifacts preserve source and exact SEO distinction', async () => {
  const preview = await prepareBundle(); const release = await prepareBundle({ release: true, siteOrigin: approvedOrigin });
  assert.equal(preview.has('sitemap.xml'), false); assert.equal(preview.has('_redirects'), false);
  assert.equal(preview.get('robots.txt').toString(), 'User-agent: *\nDisallow: /\n');
  for (const page of ['index.html', 'en/index.html']) {
    const html = release.get(page).toString();
    assert.ok(html.includes(`rel="canonical" href="${approvedOrigin}/${page}"`)); assert.match(html, /content="index,follow"/u); assert.ok(!html.includes('noindex'));
    for (const [language, target] of [['zh-Hant', 'index.html'], ['en', 'en/index.html'], ['x-default', 'index.html']]) assert.ok(html.includes(`hreflang="${language}" href="${approvedOrigin}/${target}"`));
    assert.equal((html.match(/rel="alternate"/gu) ?? []).length, 3);
    assert.ok(preview.get(page).equals(await readFile(path.join(projectRoot, 'public', page))));
  }
  const sitemap = release.get('sitemap.xml').toString(); assert.equal((sitemap.match(/<loc>/gu) ?? []).length, 2); assert.equal((sitemap.match(/<xhtml:link/gu) ?? []).length, 6);
  assert.ok(release.get('robots.txt').toString().includes(`${approvedOrigin}/sitemap.xml`));
  assert.ok(release.get('404.html').toString().includes('noindex,nofollow')); assert.ok(release.get('en/404.html').toString().includes('noindex,nofollow'));
  const headers = release.get('_headers').toString();
  for (const [name, value] of Object.entries(securityHeaders)) assert.ok(headers.includes(`${name}: ${value}`));
  assert.ok(headers.includes('Content-Type: text/javascript; charset=utf-8'));
  assert.ok(!headers.split('/js/*')[0].includes('X-Robots-Tag'));
  assert.ok(![...release.keys()].some(name => /docs|test|\.env|\.git|\.runs|package\.json/u.test(name)));
  const config = JSON.parse(await readFile(path.join(projectRoot, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.assets.html_handling, 'none'); assert.equal(config.assets.not_found_handling, '404-page'); assert.equal(config.workers_dev, false); assert.equal(config.observability.enabled, false);
  assert.deepEqual(config.routes, [{ pattern: 'diff.glossquote.com', custom_domain: true }]);
});
test('T07 release rejects missing, credential-like and unapproved URL options', async () => {
  for (const args of [['--release'], ['--site', approvedOrigin], ['--release', '--site', 'https://example.com'], ['--release', '--site', `${approvedOrigin}/`], ['--release', '--site', 'https://fake:fake@diff.glossquote.com']]) assert.throws(() => parseBuildOptions(args));
  await assert.rejects(prepareBundle({ release: true })); await assert.rejects(prepareBundle({ siteOrigin: approvedOrigin }));
});
test('T07 actual HTTP localized 404, security headers, and release redirect behavior', async t => {
  const server = await createStaticServer({ preview: false }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  for (const [route, phrase] of [['/missing', '找不到此頁面'], ['/en/missing/deep', 'Page not found']]) {
    const response = await fetch(base + route); assert.equal(response.status, 404); assert.ok((await response.text()).includes(phrase)); assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  }
  const response = await fetch(base + '/en/index.html'); assert.equal(response.status, 200); assert.equal(response.headers.get('x-robots-tag'), null);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal((await fetch(base + '/js/worker.mjs')).headers.get('cache-control'), 'public, max-age=3600');
  const redirect = await fetch(base + '/', { redirect: 'manual' }); assert.equal(redirect.status, 301); assert.equal(redirect.headers.get('location'), '/index.html');
});
