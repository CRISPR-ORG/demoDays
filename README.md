# IIITN Demo Days 2026 — Registration Website

A React + Node.js registration platform for IIITN Demo Days 2026. Features a poster-styled landing page with event details and a team registration form that stores submissions in Google Sheets and uploads presentation decks to Google Drive.

## Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Express.js, Google Sheets API, Google Drive API
- **Deployment:** Docker, Docker Compose

## Project Structure

```
demoDays/
├── client/                 React 18 + Vite front end
│   ├── public/             poster, PPT template, favicon
│   └── src/
│       ├── content/event.js    ← all event copy
│       ├── config.js           ← team-size + upload limits
│       ├── components/         nav, footer, tape marquee, countdown, reveal, icons
│       ├── pages/Home.jsx      landing page
│       └── pages/Register.jsx  registration form
├── server/                 Express API
│   ├── src/app.js              Express app (no listen())
│   ├── src/index.js            entry point (calls listen())
│   ├── src/routes/register.js  validation → Drive upload → Sheet append
│   ├── src/services/           googleAuth, sheets, drive, local fallback
│   └── scripts/get-refresh-token.js
├── Dockerfile
├── docker-compose.yml
└── package.json            npm workspaces + dev script
```

## Quick Start

```bash
npm install
cp server/.env.example server/.env
npm run dev          # API on :4000, site on :5173
```

Open <http://localhost:5173>.

## Docker Deployment

```bash
docker compose up --build -d
```

The app runs on port 4000. Configure environment variables in `docker-compose.yml` or a `.env` file.

## What the Form Collects

| Field | Rules |
|-------|-------|
| Team name | 3–60 chars, must be unique |
| Team lead email | valid email, `@iiitn.ac.in` domain |
| Team lead phone | 10-digit Indian mobile |
| Number of members | 2–4 |
| Per member | full name + BT ID (format: BT26[BRANCH]###) |
| Idea deck | PDF / PPT / PPTX, max 4 MB |

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/health` | uptime + storage mode |
| `GET` | `/api/status` | registration window + storage mode |
| `POST` | `/api/register` | multipart submission |

## Configuration

All event copy (dates, stages, prizes, rules, FAQ) lives in `client/src/content/event.js`. Team size limits are in `client/src/config.js` and `server/src/config.js`.

Google credentials are set via environment variables (see `server/.env.example`). Supports both service account and OAuth authentication modes.