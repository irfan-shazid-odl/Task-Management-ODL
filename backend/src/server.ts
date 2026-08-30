import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

async function main() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`[server] Ops Center API listening on http://localhost:${env.port}`);
    console.log(`[server] CORS origins: ${env.corsOrigins.join(', ')}`);
  });

  // Node's default keepAliveTimeout (5s) is shorter than the idle-connection
  // timeout of most reverse proxies/load balancers in front of a production
  // deployment (nginx defaults to 75s, AWS ALB to 60s). When Node closes a
  // kept-alive socket first, the proxy can hand a request to that
  // already-closed connection, producing intermittent ECONNRESET/502s that
  // only appear under real concurrent traffic, not single-request local
  // testing. Raising it above typical proxy timeouts (headersTimeout must
  // exceed keepAliveTimeout — Node enforces this) removes that race. Pure
  // connection-handling behavior; no request is treated any differently.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
