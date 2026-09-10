/**
 * One-time helper: mints a Google OAuth refresh token for this app.
 *
 * Why you may need this: a service account owns the files it creates but has no
 * Drive storage quota of its own, so uploading into a personal "My Drive"
 * folder fails. Authorising as your own Google account (the one that owns the
 * Demo Days folder) fixes that — the files are owned by you.
 *
 * Usage:
 *   1. In Google Cloud Console create an OAuth client of type "Desktop app".
 *   2. Put the id/secret in server/.env as GOOGLE_OAUTH_CLIENT_ID / _SECRET.
 *   3. node scripts/get-refresh-token.js
 *   4. Open the printed URL, approve, and copy the refresh token into .env
 *      as GOOGLE_OAUTH_REFRESH_TOKEN.
 */
import http from 'node:http';
import 'dotenv/config';
import { google } from 'googleapis';

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in server/.env first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404).end();
    return;
  }

  const code = new URL(req.url, REDIRECT_URI).searchParams.get('code');

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('No authorisation code received.');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res
      .writeHead(200, { 'Content-Type': 'text/html' })
      .end('<h1>Done.</h1><p>Refresh token printed in your terminal. You can close this tab.</p>');

    console.log('\n─────────────────────────────────────────────');
    console.log('Add this line to server/.env:\n');
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('─────────────────────────────────────────────\n');

    if (!tokens.refresh_token) {
      console.log('No refresh token returned. Revoke the app at');
      console.log('https://myaccount.google.com/permissions and run this again.\n');
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Token exchange failed.');
    console.error(error);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('\nAdd this redirect URI to your OAuth client:');
  console.log(`  ${REDIRECT_URI}\n`);
  console.log('Then open this URL in your browser:\n');
  console.log(`  ${authUrl}\n`);
});
