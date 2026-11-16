// 本机静态服务：把仓库根目录挂在 http://127.0.0.1:<port>/ ，给本机 Chrome 打开 engine/common/shell-wc.html 用。
// 用法（仓库根目录）：node engine/tools/serve.mjs [port]   默认 8771；只监听 127.0.0.1。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const port = +process.argv[2] || 8771;
http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (p !== ROOT && !p.startsWith(ROOT + path.sep)) { r.writeHead(403); return r.end(); }
  fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(b); });
}).listen(port, '127.0.0.1', () => console.log(`serving ${ROOT} at http://127.0.0.1:${port}/`));
