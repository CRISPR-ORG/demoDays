import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { config, SERVER_DIR } from '../config.js';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

let cached = null;

function readServiceAccount() {
  const { serviceAccountJson, serviceAccountFile } = config.google;

  if (serviceAccountJson.trim()) {
    return JSON.parse(serviceAccountJson);
  }
  if (serviceAccountFile.trim()) {
    const resolved = path.isAbsolute(serviceAccountFile)
      ? serviceAccountFile
      : path.resolve(SERVER_DIR, serviceAccountFile);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }
  return null;
}

/**
 * Resolves Google API clients, preferring OAuth user credentials when present
 * (a real user owns uploaded files, so personal My Drive folders work) and
 * falling back to a service account (required for Shared Drives).
 *
 * Returns `null` when nothing is configured, which puts the app in local
 * fallback mode instead of failing registrations.
 */
export function getGoogleClients() {
  if (cached !== null) return cached;

  const { oauth } = config.google;
  let auth = null;
  let mode = null;

  if (oauth.clientId && oauth.clientSecret && oauth.refreshToken) {
    const client = new google.auth.OAuth2(oauth.clientId, oauth.clientSecret);
    client.setCredentials({ refresh_token: oauth.refreshToken });
    auth = client;
    mode = 'oauth';
  } else {
    const key = readServiceAccount();
    if (key) {
      auth = new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: SCOPES,
      });
      mode = 'service_account';
    }
  }

  if (!auth) {
    cached = null;
    return null;
  }

  cached = {
    mode,
    auth,
    sheets: google.sheets({ version: 'v4', auth }),
    drive: google.drive({ version: 'v3', auth }),
  };
  return cached;
}

export function googleStatus() {
  const clients = getGoogleClients();
  return {
    configured: Boolean(clients),
    mode: clients?.mode ?? 'local-fallback',
    sheetConfigured: Boolean(config.google.sheetId),
    driveConfigured: Boolean(config.google.driveFolderId),
  };
}
