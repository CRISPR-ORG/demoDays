import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { googleStatus } from './services/googleAuth.js';
import registerRoutes from './routes/register.js';

/**
 * The Express app itself, with no `listen()` call — importable both by
 * `index.js` (local/traditional Node hosting) and by `api/[...path].mjs`
 * (Vercel serverless: Vercel invokes this app directly as a request handler
 * for every `/api/*` path, so it must never bind a port).
 */
const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(cors({ origin: config.corsOrigins, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), storage: googleStatus() });
});

app.use('/api', registerRoutes);

// Serve the built React app in production (single-service deploy, e.g. a plain
// Node host). On Vercel this branch is skipped — the static build is served
// directly by Vercel's CDN via `outputDirectory`, not by this function.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, message: 'Not found' });
});

app.use((error, _req, res, _next) => {
  console.error('[demo-days] unhandled error:', error);
  const isQuota = /storageQuotaExceeded|storage quota/i.test(error?.message ?? '');
  res.status(500).json({
    ok: false,
    message: isQuota
      ? 'The Drive upload failed because of a storage-quota limit on the server credentials. Please contact the organisers.'
      : 'Something went wrong while saving your registration. Please try again.',
  });
});

export default app;
