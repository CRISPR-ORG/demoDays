import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { googleStatus } from './services/googleAuth.js';
import registerRoutes from './routes/register.js';

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

// Serve the built React app in production (single-service deploy).
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

app.listen(config.port, () => {
  const status = googleStatus();
  console.log(`\n  IIITN Demo Days API → http://localhost:${config.port}`);
  console.log(`  storage mode: ${status.mode}`);
  if (!status.configured) {
    console.log('  ⚠ Google credentials not set — submissions save to server/data/ instead.');
    console.log('    See README.md → "Google setup" to enable Sheets + Drive.\n');
  } else {
    console.log('');
  }
});
