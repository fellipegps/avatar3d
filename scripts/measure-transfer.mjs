import http from 'node:http';
import { gunzipSync } from 'node:zlib';
// Bytes reais do corpo HTTP (gzip incluído); não conta headers nem estima rede móvel.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4173/');
const entries = [];
async function read(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'accept-encoding': 'gzip' } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        if (response.statusCode !== 200) { reject(new Error(`${url.pathname}: HTTP ${response.statusCode}`)); return; }
        const body = Buffer.concat(chunks), encoding = response.headers['content-encoding'] ?? null;
        const decoded = encoding === 'gzip' ? gunzipSync(body) : body;
        entries.push({ path: url.pathname, status: response.statusCode, encodedBytes: body.length, decodedBytes: decoded.length, encoding });
        resolve(decoded);
      });
    }).on('error', reject);
  });
}
const html = (await read(base)).toString();
const paths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
paths.push('models/character.glb', 'images/scene-fallback.svg');
for (const path of paths) {
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error('Asset fora da origem local');
  await read(url);
}
console.log(JSON.stringify({ base: base.href, entries, totalTransferBodyBytes: entries.reduce((sum, item) => sum + item.encodedBytes, 0),
  totalDecodedBytes: entries.reduce((sum, item) => sum + item.decodedBytes, 0) }, null, 2));
