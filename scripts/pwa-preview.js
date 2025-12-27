import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

// 1) build
console.log('Building production bundle...');
execSync('npm run build', { stdio: 'inherit' });

// 2) simple static server with SPA fallback
const server = http.createServer((req, res) => {
  try {
    const reqPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
    let filePath = path.join(DIST_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    stream.pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
    console.error(err);
  }
});

server.listen(PORT, async () => {
  console.log(`Serving dist/ on http://localhost:${PORT}`);
  console.log('\nAttempting to start ngrok (requires ngrok CLI or npx)');
  const ngrokProc = spawn('npx', ['ngrok', 'http', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });

  ngrokProc.stdout.on('data', chunk => {
    const text = chunk.toString();
    process.stdout.write(text);
    const match = text.match(/https:\/\/[-A-Za-z0-9+.]*ngrok\.io|https:\/\/[A-Za-z0-9.-]+/g);
    if (match) {
      // prefer the first https url
      const url = match.find(u => u.startsWith('https')) || match[0];
      console.log('\nngrok public URL:', url);
      console.log('Open this URL on your Android device and install the PWA from the browser.');
      console.log('Press Ctrl+C to stop the server and ngrok.');
    }
  });

  ngrokProc.stderr.on('data', d => process.stderr.write(d.toString()));

  ngrokProc.on('exit', code => {
    if (code !== 0) console.error('ngrok process exited with code', code);
  });
});

// handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  server.close();
  try { await ngrok.kill(); } catch (e) {}
  process.exit(0);
});
