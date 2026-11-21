import type { IncomingMessage, ServerResponse } from 'node:http';
import { handle } from './handler.js';

export default function catchAll(req: IncomingMessage, res: ServerResponse) {
  return handle(req, res);
}
