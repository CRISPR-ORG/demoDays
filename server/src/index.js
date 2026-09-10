import app from './app.js';
import { config } from './config.js';
import { googleStatus } from './services/googleAuth.js';

// Local / traditional-host entry point. Not used on Vercel — there,
// `api/[...path].mjs` imports `app.js` directly and Vercel handles listening.
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
