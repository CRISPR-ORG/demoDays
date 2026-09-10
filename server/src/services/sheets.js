import { config, TEAM } from '../config.js';
import { getGoogleClients } from './googleAuth.js';
import { normalizeTeamName } from './teamName.js';

const HEADERS = [
  'Timestamp (IST)',
  'Team Name',
  'Team Size',
  'Leader Email',
  'Leader Phone',
  ...Array.from({ length: TEAM.max }, (_, i) => [`Member ${i + 1} Name`, `Member ${i + 1} BT ID`]).flat(),
  'Presentation File',
  'Presentation Link',
];

const quoteTab = (tab) => `'${String(tab).replace(/'/g, "''")}'`;

async function ensureHeaderRow(sheets) {
  const range = `${quoteTab(config.google.sheetTab)}!A1:${columnLetter(HEADERS.length)}1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.sheetId,
    range,
  });

  if (!existing.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.google.sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

function columnLetter(index) {
  let letter = '';
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter || 'A';
}

/** Ensures the target tab exists, creating it when the spreadsheet lacks it. */
async function ensureTab(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: config.google.sheetId });
  const found = meta.data.sheets?.some(
    (sheet) => sheet.properties?.title === config.google.sheetTab,
  );
  if (found) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: config.google.sheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: config.google.sheetTab } } }],
    },
  });
}

export function buildRow(registration) {
  const memberCells = Array.from({ length: TEAM.max }, (_, i) => {
    const member = registration.members[i];
    return [member?.name ?? '', member?.btId ?? ''];
  }).flat();

  return [
    registration.submittedAt,
    registration.teamName,
    registration.members.length,
    registration.leaderEmail,
    registration.leaderPhone,
    ...memberCells,
    registration.presentation?.fileName ?? '',
    registration.presentation?.link ?? '',
  ];
}

export async function appendRegistrationRow(registration) {
  const clients = getGoogleClients();
  if (!clients || !config.google.sheetId) return { appended: false, reason: 'not-configured' };

  const { sheets } = clients;
  await ensureTab(sheets);
  await ensureHeaderRow(sheets);

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.sheetId,
    range: `${quoteTab(config.google.sheetTab)}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [buildRow(registration)] },
  });

  return { appended: true };
}

// Derived from HEADERS rather than hardcoded, so a future column reorder can
// never silently point this at the wrong column again.
const TEAM_NAME_COLUMN = columnLetter(HEADERS.indexOf('Team Name') + 1);

/** Case-insensitive team-name lookup so two teams cannot share a name. */
export async function teamNameExists(teamName) {
  const clients = getGoogleClients();
  if (!clients || !config.google.sheetId) return false;

  try {
    const response = await clients.sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: `${quoteTab(config.google.sheetTab)}!${TEAM_NAME_COLUMN}2:${TEAM_NAME_COLUMN}`,
    });
    const target = normalizeTeamName(teamName);
    return (response.data.values ?? []).some(([name]) => normalizeTeamName(name) === target);
  } catch {
    // A missing tab or transient read failure must not block a registration.
    return false;
  }
}

export { HEADERS };
