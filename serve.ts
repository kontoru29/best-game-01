// Serve game/ locally for play-testing: node serve.ts, then open
// http://localhost:8080 in desktop Chrome.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const clean = req.url.split('?')[0];
  const path = join(here, 'game', clean === '/' ? 'index.html' : clean.replace(/^\/+/, ''));
  try {
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
server.listen(8080, () => console.log('ROOTWARDEN at http://localhost:8080'));
