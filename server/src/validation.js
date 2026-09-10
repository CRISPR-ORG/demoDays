import { z } from 'zod';
import { TEAM } from './config.js';

const trimmed = (schema) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), schema);

/** Trims and collapses internal runs of whitespace to a single space. */
const tidy = (schema) =>
  z.preprocess((v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : v), schema);

// Keep in sync with client/src/config.js — BT_ID_PATTERN / BT_ID_EXAMPLE.
const BT_ID_PATTERN = /^BT26(ECE|ECI|CSE|CSD|CSH|CSA)\d{3}$/;
const BT_ID_MESSAGE = 'BT ID must look like BT26CSE001 (BT26 + ECE/ECI/CSE/CSD/CSH/CSA + 3 digits)';

const memberSchema = z.object({
  name: tidy(
    z
      .string()
      .min(2, 'Member name must be at least 2 characters')
      .max(80, 'Member name is too long')
      .regex(/^[A-Za-z][A-Za-z.'\-\s]*$/, 'Member name may only contain letters, spaces, . - and \''),
  ),
  btId: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toUpperCase().replace(/\s+/g, '') : v),
    z.string().regex(BT_ID_PATTERN, BT_ID_MESSAGE),
  ),
});

export const registrationSchema = z
  .object({
    teamName: tidy(
      z
        .string()
        .min(3, 'Team name must be at least 3 characters')
        .max(60, 'Team name must be 60 characters or fewer')
        .regex(/^[A-Za-z0-9][A-Za-z0-9 ._&'\-]*$/, 'Team name contains unsupported characters'),
    ),
    leaderEmail: trimmed(
      z
        .string()
        .email('Enter a valid email address')
        .max(120)
        .toLowerCase()
        .refine((v) => v.endsWith('@iiitn.ac.in'), 'Use your @iiitn.ac.in email address'),
    ),
    leaderPhone: z.preprocess(
      (v) => (typeof v === 'string' ? v.replace(/[\s\-()]/g, '') : v),
      z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    ),
    members: z
      .array(memberSchema)
      .min(TEAM.min, `A team needs at least ${TEAM.min} member${TEAM.min === 1 ? '' : 's'}`)
      .max(TEAM.max, `A team can have at most ${TEAM.max} members`),
  })
  .superRefine((value, ctx) => {
    const seen = new Set();
    value.members.forEach((member, index) => {
      if (seen.has(member.btId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['members', index, 'btId'],
          message: 'This BT ID is already listed for another member',
        });
      }
      seen.add(member.btId);
    });
  });

/** Flattens Zod issues into `{ 'members.0.btId': 'message' }` for the form UI. */
export function formatIssues(error) {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
