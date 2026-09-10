# IIITN Demo Days 2026 — event site & registration

A Node + React project for **IIITN Demo Days 2026**: a poster-styled landing page with
the full event brief, plus a registration form that writes each team into a Google
Sheet and uploads their idea deck to a Google Drive folder.

```
demoDays/
├── client/                 React 18 + Vite front end
│   ├── public/             poster, PPT template, favicon
│   └── src/
│       ├── content/event.js    ← all event copy lives here
│       ├── config.js           ← team-size + upload limits
│       ├── components/         nav, footer, tape marquee, countdown, reveal, icons
│       ├── pages/Home.jsx      landing page
│       └── pages/Register.jsx  registration form
├── server/                 Express API
│   ├── src/routes/register.js  validation → Drive upload → Sheet append
│   ├── src/services/           googleAuth, sheets, drive, local fallback
│   └── scripts/get-refresh-token.js
└── package.json            npm workspaces + dev script
```

## Quick start

```bash
npm install          # installs both workspaces
cp server/.env.example server/.env
npm run dev          # API on :4000, site on :5173
```

Open <http://localhost:5173>.

**It works immediately without Google credentials.** Until they are configured, each
registration is saved to `server/data/submissions.json` with the deck in
`server/data/uploads/`, and the API logs a warning. Nothing is lost — you can push
those rows into the sheet later.

## Production

```bash
npm run build        # builds client/dist
npm start            # Express serves the API *and* the built site on :4000
```

The server auto-detects `client/dist` and serves it with an SPA fallback, so the whole
thing deploys as one service. Set `NODE_ENV=production` and a real `CORS_ORIGIN`.

---

## Google setup

Both destinations are already filled in `server/.env.example`:

| Destination | ID |
|---|---|
| Spreadsheet | `1EJvP3factXilqJ-lzGl8VmQcXlzea0Jl2TwPFOfjT3Q` |
| Drive folder | `1nRiv-38lDkpM2fgLQk5zsjbFjhiuh1m3` |

In the Google Cloud console, create a project and **enable the Google Sheets API and
the Google Drive API**. Then pick one of the two auth modes.

### Mode A — Service account (simplest)

1. **IAM & Admin → Service Accounts → Create**, then **Keys → Add key → JSON**.
2. Save the file as `server/service-account.json`.
3. Share **both** the spreadsheet and the Drive folder with the service account's
   `client_email` (found in the JSON), giving it **Editor** access.
4. Leave `GOOGLE_SERVICE_ACCOUNT_FILE=./service-account.json` in `.env`.

> ### ⚠️ Important: the Drive upload caveat
> A service account owns the files it creates but has **no Drive storage quota of its
> own**. If your folder sits in someone's personal *My Drive*, uploads fail with
> `storageQuotaExceeded` — Sheets still works fine.
>
> Two ways around it:
> - **Move the folder into a Shared Drive** and set
>   `GOOGLE_DRIVE_IS_SHARED_DRIVE=true`, or
> - **use Mode B below**, which uploads as a real user.

### Mode B — OAuth as your own account (works with My Drive)

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type
   **Desktop app**.
2. Put the client id and secret in `server/.env` as `GOOGLE_OAUTH_CLIENT_ID` and
   `GOOGLE_OAUTH_CLIENT_SECRET`.
3. Run the helper and follow its instructions:
   ```bash
   npm run token --workspace server
   ```
4. Paste the printed `GOOGLE_OAUTH_REFRESH_TOKEN` into `server/.env`.

Sign in as the account that owns the Drive folder. Files are then owned by you and
count against your quota, so My Drive folders work normally.

When OAuth variables are present they take priority over the service account.
Check which mode is live at any time:

```bash
curl localhost:4000/api/status
```

### Sheet layout

The tab named by `GOOGLE_SHEET_TAB` (default `Registrations`) is created automatically
if missing, and the header row is written on the first submission:

```
Timestamp (IST) | Team Name | Team Size | Leader Email | Leader Phone |
Member 1 Name | Member 1 BT ID | … | Member 4 Name | Member 4 BT ID |
Presentation File | Presentation Link
```

One row per team. Unused member columns stay blank.

---

## What the form collects

| Field | Rules |
|---|---|
| Team name | 3–60 chars, must be unique (checked against the sheet, case- and spacing-insensitive) |
| Team lead email | valid email |
| Team lead phone | 10-digit Indian mobile, optional `+91` |
| Number of members | 2–4, selectable |
| Per member | full name + BT ID (uppercased, no duplicates within a team) |
| Idea deck | PDF / PPT / PPTX, max 4 MB, drag-and-drop with live upload progress |

Member 1 is treated as the team lead. Teams are identified by their (unique) team
name throughout — there's no separate registration ID shown to entrants or stored in
the sheet. The uploaded deck is saved in Drive under the team's name (e.g.
`campus-compass.pdf`).

### Team size

Set to **2–4 members**, matching the event brief. Both ends are one constant each:

- `client/src/config.js` → `TEAM_MIN`, `TEAM_MAX`
- `server/src/config.js` → `TEAM.min`, `TEAM.max` (or `MIN_TEAM_SIZE`/`MAX_TEAM_SIZE` in `.env`)

Changing them updates the selector, the validation, and the sheet's member columns.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | uptime + storage mode |
| `GET` | `/api/status` | registration window + storage mode |
| `POST` | `/api/register` | multipart submission (`teamName`, `leaderEmail`, `leaderPhone`, `members` JSON, `presentation` file) |

Validation errors come back as `{ ok: false, fieldErrors: { 'members.1.btId': '…' } }`
and the form maps them onto the matching inputs.

Registration is refused automatically after `REGISTRATION_CLOSES_AT`
(default 15 Sep 2026, 8:00 PM IST) — the form shows a closed banner and disables
submitting. Set `ALLOW_LATE_REGISTRATION=true` to keep accepting entries.

Submissions are rate-limited to 12 per 15 minutes per IP.

## Editing content

All event copy — dates, stages, prizes, rules, eligibility, FAQ — is in
`client/src/content/event.js`. No component changes needed to update the site.

### Numbers to double-check with the organisers

The source brief is internally inconsistent in a couple of places; the site currently uses:

- **Registration closes 15 Sep 2026** (poster tape + brief header). One later line in
  the brief says 17 September.
- **17 September 2026** is treated as the on-campus prelims date.

Prize tiers are confirmed as **Winner ₹7,000 · First runner-up ₹5,000 · Second
runner-up ₹3,000**, totalling the poster's **₹15,000** pool.
