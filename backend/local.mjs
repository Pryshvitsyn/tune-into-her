// Node 24+ strips TypeScript. Sandbox-only loopback server with persistent SQLite.
import { Buffer } from 'node:buffer';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { handle } from './src/worker.ts';
const stateDir = new URL('./.local/', import.meta.url);
await mkdir(stateDir, { recursive: true });
const db = new DatabaseSync(fileURLToPath(new URL('sandbox.sqlite', stateDir)));
db.exec(await readFile(new URL('./migrations/0001_billing.sql', import.meta.url), 'utf8'));
const DB = { prepare(sql) { return { bind(...args) { return { async first() { return db.prepare(sql).get(...args) ?? null; }, async run() { db.prepare(sql).run(...args); } }; } }; } };
const env = { DB, ENVIRONMENT: 'sandbox', REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH, REVENUECAT_WEBHOOK_SIGNING_SECRET: process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET, REVENUECAT_APP_IDS: process.env.REVENUECAT_APP_IDS };
createServer(async (incoming, outgoing) => {
  try {
    const chunks = []; let size = 0;
    for await (const chunk of incoming) { size += chunk.length; if (size > 65536) { outgoing.writeHead(413); outgoing.end(); return; } chunks.push(chunk); }
    const body = Buffer.concat(chunks);
    const request = new Request(`http://127.0.0.1:8787${incoming.url}`, { method: incoming.method, headers: incoming.headers, ...(body.length ? { body } : {}) });
    const result = await handle(request, env);
    outgoing.writeHead(result.status, Object.fromEntries(result.headers)); outgoing.end(Buffer.from(await result.arrayBuffer()));
  } catch { outgoing.writeHead(500); outgoing.end(); }
}).listen(8787, '127.0.0.1', () => console.info('Tune Into Her trial sandbox: http://127.0.0.1:8787; persistent local SQLite; no cloud deployment.'));
