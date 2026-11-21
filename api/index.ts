import type { IncomingMessage, ServerResponse } from 'node:http';
import { handle } from './handler.js';

export default function index(req: IncomingMessage, res: ServerResponse) {
  return handle(req, res);
}
