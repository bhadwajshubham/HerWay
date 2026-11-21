import { buildApp } from './app.js';
import { config } from './config.js';

const app = buildApp();

await app.listen({ port: config.API_PORT, host: '0.0.0.0' });

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
