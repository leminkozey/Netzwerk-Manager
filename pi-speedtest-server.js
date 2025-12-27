const http = require('http');
const { randomBytes } = require('crypto');
const { URL } = require('url');

const PORT = parseInt(process.env.PI_SPEEDTEST_PORT, 10) || 8080;
const MAX_MB = 50;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(body);
}

function handleDownload(req, res, sizeMB) {
  const safeSize = Math.max(1, Math.min(sizeMB || 1, MAX_MB));
  const totalBytes = safeSize * 1024 * 1024;

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': totalBytes,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });

  let sent = 0;
  const chunkSize = 64 * 1024;

  function writeChunk() {
    while (sent < totalBytes) {
      const remaining = totalBytes - sent;
      const size = Math.min(chunkSize, remaining);
      const chunk = randomBytes(size);
      const ok = res.write(chunk);
      sent += size;
      if (!ok) {
        res.once('drain', writeChunk);
        return;
      }
    }
    res.end();
  }

  writeChunk();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'HEAD' && path === '/speedtest/ping') {
    res.writeHead(204, { 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.end();
    return;
  }

  if (req.method === 'GET' && path === '/speedtest/download') {
    const sizeMB = parseInt(url.searchParams.get('size'), 10) || 1;
    handleDownload(req, res, sizeMB);
    return;
  }

  if (req.method === 'POST' && path === '/speedtest/upload') {
    let received = 0;
    req.on('data', (chunk) => {
      received += chunk.length;
    });
    req.on('end', () => {
      sendJson(res, 200, { ok: true, bytes: received });
    });
    req.on('error', () => {
      sendJson(res, 500, { ok: false, error: 'upload_failed' });
    });
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`Pi speedtest server listening on http://0.0.0.0:${PORT}`);
});
