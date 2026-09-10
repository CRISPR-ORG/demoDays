import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { config, UPLOAD } from '../config.js';
import { formatIssues, registrationSchema } from '../validation.js';
import { getGoogleClients, googleStatus } from '../services/googleAuth.js';
import { appendRegistrationRow, teamNameExists } from '../services/sheets.js';
import { uploadPresentation } from '../services/drive.js';
import { localTeamNameExists, saveDeckBackup, saveLocally } from '../services/localStore.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const okExtension = UPLOAD.allowedExtensions.includes(extension);
    const okMime = UPLOAD.allowedMimeTypes.includes(file.mimetype);
    if (okExtension && okMime) return cb(null, true);
    cb(new UploadTypeError('Only PDF, PPT or PPTX files are accepted'));
  },
});

class UploadTypeError extends Error {}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Too many attempts from this network. Please retry in a few minutes.' },
});

const IST = 'Asia/Kolkata';

function istTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: false,
  }).format(date);
}

function makeRegistrationId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `DD26-${suffix}`;
}

function slug(value) {
  return value
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'team';
}

function registrationClosed() {
  if (config.registration.allowLate) return false;
  const closesAt = new Date(config.registration.closesAt);
  if (Number.isNaN(closesAt.getTime())) return false;
  return Date.now() > closesAt.getTime();
}

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    registrationClosesAt: config.registration.closesAt,
    registrationClosed: registrationClosed(),
    storage: googleStatus(),
  });
});

router.post('/register', limiter, (req, res, next) => {
  upload.single('presentation')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof UploadTypeError) {
      return res.status(400).json({ ok: false, fieldErrors: { presentation: error.message } });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        ok: false,
        fieldErrors: {
          presentation: `File is larger than ${Math.round(UPLOAD.maxBytes / (1024 * 1024))} MB`,
        },
      });
    }
    return next(error);
  });
}, async (req, res, next) => {
  try {
    if (registrationClosed()) {
      return res.status(403).json({
        ok: false,
        message: 'Registration for IIITN Demo Days 2026 has closed.',
      });
    }

    let members;
    try {
      members = typeof req.body.members === 'string' ? JSON.parse(req.body.members) : req.body.members;
    } catch {
      return res.status(400).json({ ok: false, fieldErrors: { members: 'Team member data was malformed' } });
    }

    const parsed = registrationSchema.safeParse({
      teamName: req.body.teamName,
      leaderEmail: req.body.leaderEmail,
      leaderPhone: req.body.leaderPhone,
      members,
    });

    if (!parsed.success) {
      return res.status(400).json({ ok: false, fieldErrors: formatIssues(parsed.error) });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        fieldErrors: { presentation: 'Attach your presentation (PDF, PPT or PPTX)' },
      });
    }

    const data = parsed.data;
    const google = getGoogleClients();

    const duplicate = google
      ? await teamNameExists(data.teamName)
      : await localTeamNameExists(data.teamName);
    if (duplicate) {
      return res.status(409).json({
        ok: false,
        fieldErrors: { teamName: 'A team is already registered with this name. Pick another.' },
      });
    }

    // Kept only for internal bookkeeping (local-fallback filenames, log lines) —
    // never surfaced to the sheet, the Drive filename, or the confirmation screen.
    const registrationId = makeRegistrationId();
    const extension = path.extname(req.file.originalname).toLowerCase() || '.pdf';
    const driveFileName = `${slug(data.teamName)}${extension}`;

    let presentation = { fileName: driveFileName, link: '' };
    let driveFailed = false;

    if (google) {
      try {
        const uploaded = await uploadPresentation({
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          fileName: driveFileName,
        });
        if (uploaded.uploaded) {
          presentation = { fileName: uploaded.fileName, link: uploaded.link ?? '' };
        }
      } catch (error) {
        // A Drive failure (e.g. a service account's storage-quota limit on a
        // personal folder) must never drop an otherwise-valid registration:
        // keep the deck on disk and flag the row so organisers can re-upload it.
        driveFailed = true;
        const reason = error?.errors?.[0]?.message ?? error.message;
        console.error(
          '[demo-days] Drive upload failed for %s (%s) — deck saved locally instead',
          registrationId,
          reason,
        );
        await saveDeckBackup(registrationId, req.file);
        presentation = {
          fileName: driveFileName,
          link: 'UPLOAD FAILED — deck saved on server, needs manual upload',
        };
      }
    }

    const registration = {
      registrationId,
      submittedAt: istTimestamp(),
      teamName: data.teamName,
      leaderEmail: data.leaderEmail,
      leaderPhone: data.leaderPhone,
      members: data.members,
      presentation,
    };

    let storedIn = 'local';

    if (google) {
      try {
        await appendRegistrationRow(registration);
        storedIn = driveFailed ? 'google-sheet-only' : 'google';
      } catch (error) {
        // Sheets is also unavailable — fall back to full local storage rather
        // than losing the submission.
        console.error(
          '[demo-days] Sheet append failed for %s (%s) — falling back to local store',
          registrationId,
          error.message,
        );
        await saveLocally(registration, req.file);
        storedIn = 'local';
      }
    } else {
      await saveLocally(registration, req.file);
      console.warn(
        '[demo-days] Google credentials missing — registration %s saved to %s',
        registrationId,
        config.localStore.file,
      );
    }

    res.status(201).json({
      ok: true,
      teamName: registration.teamName,
      teamSize: registration.members.length,
      submittedAt: registration.submittedAt,
      storedIn,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
