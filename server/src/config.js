import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bool = (value, fallback = false) =>
  value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const SERVER_DIR = path.resolve(__dirname, '..');

/**
 * Team size limits. Keep in sync with `client/src/config.js`.
 * Matches the event brief: 2–4 members per team.
 */
export const TEAM = {
  min: Number(process.env.MIN_TEAM_SIZE ?? 2),
  max: Number(process.env.MAX_TEAM_SIZE ?? 4),
};

export const UPLOAD = {
  // Kept under Vercel's hard ~4.5MB serverless request-body limit (there's no
  // config flag to raise that cap). If this ever moves off Vercel onto a
  // regular Node host, it's safe to raise this back up.
  maxBytes: 4 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  allowedExtensions: ['.pdf', '.ppt', '.pptx'],
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  google: {
    sheetId: process.env.GOOGLE_SHEET_ID ?? '',
    sheetTab: process.env.GOOGLE_SHEET_TAB ?? 'Registrations',
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? '',
    isSharedDrive: bool(process.env.GOOGLE_DRIVE_IS_SHARED_DRIVE),
    serviceAccountFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE ?? '',
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '',
    oauth: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
      refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? '',
    },
  },

  registration: {
    closesAt: process.env.REGISTRATION_CLOSES_AT ?? '2026-09-15T20:00:00+05:30',
    allowLate: bool(process.env.ALLOW_LATE_REGISTRATION),
  },

  /**
   * Where submissions land if Google is unreachable. On a normal host this is
   * a folder next to the server code; on Vercel the filesystem is read-only
   * except `/tmp`, which is also wiped between invocations — so this is a
   * short-lived safety net there, not durable storage. Google Sheets/Drive
   * remains the real source of truth in both cases.
   */
  localStore: (() => {
    const base = process.env.VERCEL ? '/tmp/demo-days-data' : path.join(SERVER_DIR, 'data');
    return {
      dir: base,
      uploadsDir: path.join(base, 'uploads'),
      file: path.join(base, 'submissions.json'),
    };
  })(),

  clientDist: path.join(ROOT_DIR, 'client', 'dist'),
};
