import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const mimeTypes = Object.freeze({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
});
export const securityHeaders = Object.freeze({
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY'
});

export function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

export async function createStaticServer({ root = path.join(projectRoot, 'public'), preview = true } = {}) {
  const realRoot = await realpath(root);
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);
    if (preview) response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const finish = (code, body = '') => {
      response.statusCode = code;
      if (!response.hasHeader('Content-Type')) response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    const notFound = async (english = false) => {
      try {
        const fallback = await realpath(path.join(realRoot, english ? 'en/404.html' : '404.html'));
        if (!isWithin(realRoot, fallback)) return finish(403, 'Forbidden');
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('X-Robots-Tag', 'noindex, nofollow');
        finish(404, await readFile(fallback));
      } catch { finish(404, 'Not found'); }
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return finish(405, 'Method not allowed');
    }
    let english = false;
    try {
      const raw = (request.url ?? '').split(/[?#]/, 1)[0];
      const decoded = decodeURIComponent(raw);
      english = decoded.startsWith('/en/');
      if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\x00-\x1f\\:]/u.test(decoded)) return finish(400, 'Invalid path');
      const parts = decoded.split('/');
      if (parts.some(part => part.startsWith('.') || /[. ]$/u.test(part))) return finish(403, 'Forbidden');
      if (!preview && ['/', '/en', '/en/'].includes(decoded)) {
        response.setHeader('Location', decoded === '/' ? '/index.html' : '/en/index.html');
        return finish(301);
      }
      const fileName = decoded.endsWith('/') ? `${decoded}index.html` : decoded;
      const target = path.resolve(realRoot, `.${fileName}`);
      if (!isWithin(realRoot, target)) return finish(403, 'Forbidden');
      const actual = await realpath(target);
      if (!isWithin(realRoot, actual)) return finish(403, 'Forbidden');
      if (!(await stat(actual)).isFile()) return notFound(english);
      const mime = mimeTypes[path.extname(actual).toLowerCase()];
      if (!mime) return notFound(english);
      response.setHeader('Content-Type', mime);
      if (['.mjs', '.js', '.css'].includes(path.extname(actual))) response.setHeader('Cache-Control', 'public, max-age=3600');
      const bytes = await readFile(actual);
      response.setHeader('Content-Length', bytes.length);
      finish(200, bytes);
    } catch (error) {
      if (error instanceof URIError) return finish(400, 'Invalid path');
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) return notFound(english);
      finish(403, 'Forbidden');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = process.argv.slice(2); let port = 4183; let dist = false; let release = false;
  while (options.length) {
    const option = options.shift();
    if (option === '--dist' && !dist) dist = true;
    else if (option === '--release' && !release) release = true;
    else if (option === '--port' && options.length && /^\d+$/u.test(options[0])) { port = Number(options.shift()); if (port > 65535) throw new Error('Invalid port'); }
    else throw new Error('Use [--dist --release] [--port <0..65535>]');
  }
  if (release && !dist) throw new Error('Release preview requires dist');
  const server = await createStaticServer({ root: path.join(projectRoot, dist ? 'dist' : 'public'), preview: !release });
  server.on('error', () => { console.error('Preview could not start; port unavailable.'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Text diff preview: http://127.0.0.1:${server.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
