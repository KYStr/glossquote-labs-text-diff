import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { checkSources } from './check.mjs';
import { projectRoot, securityHeaders } from './serve.mjs';

export const approvedOrigin = 'https://diff.glossquote.com';
export function parseBuildOptions(args) {
  if (args.length === 0) return { release: false };
  if (args.length !== 3 || args[0] !== '--release' || args[1] !== '--site' || args[2] !== approvedOrigin) throw new Error('Release requires --release --site https://diff.glossquote.com');
  return { release: true, siteOrigin: approvedOrigin };
}
const escape = text => text.replace(/&/gu, '&amp;').replace(/"/gu, '&quot;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
export function seoHtml(html, page, origin) {
  if (origin !== approvedOrigin || !['index.html', 'en/index.html'].includes(page)) throw new Error('Unapproved release URL');
  const urls = { 'zh-Hant': `${origin}/index.html`, en: `${origin}/en/index.html`, 'x-default': `${origin}/index.html` };
  const title = html.match(/<title>([^<]+)<\/title>/u)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/u)?.[1];
  if (!title || !description || !html.includes('content="noindex,nofollow"')) throw new Error('Source SEO requirements missing');
  const block = [
    `  <link rel="canonical" href="${urls[page === 'index.html' ? 'zh-Hant' : 'en']}">`,
    ...Object.entries(urls).map(([language, url]) => `  <link rel="alternate" hreflang="${language}" href="${url}">`),
    '  <meta property="og:type" content="website">',
    `  <meta property="og:title" content="${escape(title)}">`,
    `  <meta property="og:description" content="${description}">`,
    `  <meta property="og:url" content="${origin}/${page}">`,
    `  <meta property="og:locale" content="${page === 'index.html' ? 'zh_TW' : 'en_US'}">`,
    '  <meta name="twitter:card" content="summary">'
  ].join('\n');
  return html.replace('content="noindex,nofollow"', 'content="index,follow"').replace('</head>', `${block}\n</head>`);
}

export async function prepareBundle({ release = false, siteOrigin } = {}) {
  if (release ? siteOrigin !== approvedOrigin : siteOrigin !== undefined) throw new Error('Unapproved build origin');
  const sources = await checkSources(); const sourceRoot = path.join(projectRoot, 'public'); const bundle = new Map();
  for (const source of sources) {
    const name = path.relative(sourceRoot, source).split(path.sep).join('/');
    let bytes = await readFile(source);
    if (release && ['index.html', 'en/index.html'].includes(name)) bytes = Buffer.from(seoHtml(bytes.toString('utf8'), name, siteOrigin));
    bundle.set(name, bytes);
  }
  if (!bundle.has('en/index.html') || !bundle.has('404.html') || !bundle.has('en/404.html')) throw new Error('Missing bilingual pages');
  bundle.set('robots.txt', Buffer.from(release ? `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n'));
  if (release) {
    const alternatives = [['zh-Hant', 'index.html'], ['en', 'en/index.html'], ['x-default', 'index.html']];
    const links = alternatives.map(([lang, page]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${siteOrigin}/${page}"/>`).join('\n');
    bundle.set('sitemap.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${['index.html', 'en/index.html'].map(page => `  <url>\n    <loc>${siteOrigin}/${page}</loc>\n${links}\n  </url>`).join('\n')}\n</urlset>\n`));
  }
  const headers = ['/*', ...Object.entries(securityHeaders).map(([name, value]) => `  ${name}: ${value}`)];
  if (!release) headers.push('  X-Robots-Tag: noindex, nofollow');
  headers.push('', '/js/*', '  Content-Type: text/javascript; charset=utf-8', '  Cache-Control: public, max-age=3600', '', '/styles/*', '  Content-Type: text/css; charset=utf-8', '  Cache-Control: public, max-age=3600', '', '/index.html', '  Cache-Control: no-store', '', '/en/index.html', '  Cache-Control: no-store', '', '/404.html', '  X-Robots-Tag: noindex, nofollow', '', '/en/404.html', '  X-Robots-Tag: noindex, nofollow', '', '/robots.txt', '  Content-Type: text/plain; charset=utf-8');
  if (release) headers.push('', '/sitemap.xml', '  Content-Type: application/xml; charset=utf-8');
  bundle.set('_headers', Buffer.from(headers.join('\n') + '\n'));
  if (release) bundle.set('_redirects', Buffer.from('/ /index.html 301\n/en /en/index.html 301\n/en/ /en/index.html 301\n'));
  return bundle;
}
