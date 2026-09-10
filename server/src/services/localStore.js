import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { normalizeTeamName } from './teamName.js';

/**
 * Development fallback: keeps registrations and uploads on disk so the site is
 * fully usable before Google credentials are wired up. Nothing is lost — the
 * JSON file can be pasted or re-pushed into the sheet later.
 */
export async function saveLocally(registration, file) {
  await fs.mkdir(config.localStore.uploadsDir, { recursive: true });

  let storedFileName = '';
  if (file) {
    storedFileName = `${registration.registrationId}${path.extname(file.originalname) || '.pdf'}`;
    await fs.writeFile(path.join(config.localStore.uploadsDir, storedFileName), file.buffer);
  }

  const existing = await readAll();
  existing.push({ ...registration, localFile: storedFileName });
  await fs.writeFile(config.localStore.file, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');

  return { storedFileName };
}

/**
 * Backup-only save: keeps just the deck file on disk under its registration ID,
 * without touching submissions.json. Used when Sheets succeeded but the Drive
 * upload itself failed, so the file is never lost while the row still lands
 * in the real spreadsheet.
 */
export async function saveDeckBackup(registrationId, file) {
  await fs.mkdir(config.localStore.uploadsDir, { recursive: true });
  const storedFileName = `${registrationId}${path.extname(file.originalname) || '.pdf'}`;
  await fs.writeFile(path.join(config.localStore.uploadsDir, storedFileName), file.buffer);
  return storedFileName;
}

export async function readAll() {
  try {
    return JSON.parse(await fs.readFile(config.localStore.file, 'utf8'));
  } catch {
    return [];
  }
}

export async function localTeamNameExists(teamName) {
  const target = normalizeTeamName(teamName);
  const all = await readAll();
  return all.some((entry) => normalizeTeamName(entry.teamName) === target);
}
