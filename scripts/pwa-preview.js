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

  // Helper to spawn a process and capture first HTTPS URL line
  const spawnAndCaptureUrl = (cmd, args) => new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let resolved = false;
    proc.stdout.on('data', chunk => {
      const text = chunk.toString();
      process.stdout.write(text);
      const match = text.match(/https:\/\/[A-Za-z0-9.-]+/g);
      if (match && !resolved) {
        resolved = true;
        resolve({ proc, url: match.find(u => u.startsWith('https')) || match[0] });
      }
    });
    proc.stderr.on('data', d => process.stderr.write(d.toString()));
    proc.on('error', err => { if (!resolved) reject(err); });
    proc.on('exit', code => { if (!resolved) reject(new Error(`${cmd} exited with ${code}`)); });
  });

  // Try permanent ngrok install (preferred) -> localtunnel global 'lt' -> npx localtunnel
  const tryTunneling = async () => {
    console.log('\nStarting tunnel (ngrok preferred, localtunnel fallback)');
    // If NGROK_AUTH_TOKEN provided, pass it; otherwise assume user has ngrok authenticated
    const ngrokToken = process.env.NGROK_AUTH_TOKEN;
    try {
      const args = ngrokToken ? ['http', String(PORT), '--authtoken', ngrokToken] : ['http', String(PORT)];
      const { proc, url } = await spawnAndCaptureUrl('ngrok', args);
      console.log('\nngrok public URL:', url);
      console.log('Open this URL on your Android device and install the PWA from the browser.');
      console.log('Press Ctrl+C to stop the server and tunnel.');
      return proc;
    } catch (ngrokErr) {
      console.warn('ngrok not available or failed:', ngrokErr.message || ngrokErr);
    }

    // try global 'lt' (localtunnel)
    try {
      const { proc, url } = await spawnAndCaptureUrl('lt', ['--port', String(PORT)]);
      console.log('\nlocaltunnel public URL:', url);
      console.log('Open this URL on your Android device and install the PWA from the browser.');
      console.log('Press Ctrl+C to stop the server and tunnel.');
      return proc;
    } catch (ltErr) {
      console.warn('localtunnel (lt) not available or failed:', ltErr.message || ltErr);
    }

    // try npx localtunnel as last resort
    try {
      const { proc, url } = await spawnAndCaptureUrl('npx', ['localtunnel', '--port', String(PORT)]);
      console.log('\nlocaltunnel public URL:', url);
      console.log('Open this URL on your Android device and install the PWA from the browser.');
      console.log('Press Ctrl+C to stop the server and tunnel.');
      return proc;
    } catch (npxErr) {
      console.warn('npx localtunnel failed:', npxErr.message || npxErr);
    }

    throw new Error('No tunneling tool available. Install ngrok (recommended) or localtunnel.');
  };

  try {
    await tryTunneling();
  } catch (err) {
    console.error('\nFailed to start any tunnel:', err.message || err);
    console.log('\nManual options:\n - Install ngrok and run: ngrok http 5000\n - Or run: npx localtunnel --port 5000');
  }
});

// handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  server.close();
  try { await ngrok.kill(); } catch (e) {}
  process.exit(0);
});
