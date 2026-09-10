// Vercel serverless entry point. The filename `[...path]` is a catch-all
// route, so Vercel sends every `/api/*` request to this one function — the
// Express app inside (server/src/app.js) then does its own internal routing
// exactly as it does under a normal Node host, using the full original path.
//
// `.mjs` is used (rather than `.js`) so this file is unambiguously ESM,
// without needing `"type": "module"` in the root package.json — the rest of
// the repo's module format is untouched.
import app from '../server/src/app.js';

export default app;
