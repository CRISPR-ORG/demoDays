/**
 * Team size limits. Keep in sync with `server/src/config.js`.
 * Matches the event brief: 2–4 members per team.
 * Change these two numbers to switch the whole form over.
 */
export const TEAM_MIN = 2;
export const TEAM_MAX = 4;

export const MAX_UPLOAD_MB = 25;
export const ACCEPTED_EXTENSIONS = ['.pdf', '.ppt', '.pptx'];

/** Team lead's email must be an IIITN institute address. */
export const EMAIL_DOMAIN = '@iiitn.ac.in';

/**
 * BT ID format. Keep in sync with server/src/validation.js — BT_ID_PATTERN.
 * BT26 + branch code + 3-digit number, e.g. BT26CSE001.
 */
export const BT_ID_BRANCHES = ['ECE', 'ECI', 'CSE', 'CSD', 'CSH', 'CSA'];
export const BT_ID_PATTERN = new RegExp(`^BT26(${BT_ID_BRANCHES.join('|')})\\d{3}$`);
export const BT_ID_EXAMPLE = 'BT26CSE001';
