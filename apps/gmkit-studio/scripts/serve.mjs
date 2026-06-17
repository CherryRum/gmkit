import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5174);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const normalized = pathname === '/' ? '/index.html' : pathname;
  const absolute = path.resolve(root, `.${normalized}`);
  if (!absolute.startsWith(root)) {
    return null;
  }
  return absolute;
}

const server = createServer(async (req, res) => {
  const filePath = resolveRequestPath(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': contentTypes.get(path.extname(filePath)) || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`GMKit Studio available at http://127.0.0.1:${port}`);
});
