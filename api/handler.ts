import type { IncomingMessage, ServerResponse } from 'node:http';
import { runWithVercelOidcToken } from '../apps/api/src/auth/firebase.js';
import { buildApp } from '../apps/api/src/app.js';

const app = buildApp();

export async function handle(req: IncomingMessage, res: ServerResponse) {
  await app.ready();
  if (req.url?.startsWith('/api/health/')) {
    req.url = req.url.slice('/api'.length);
  }
  const token = req.headers['x-vercel-oidc-token'];
  runWithVercelOidcToken(
    typeof token === 'string' ? token : undefined,
    () => app.server.emit('request', req, res)
  );
}
