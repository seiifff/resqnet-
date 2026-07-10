# ResQNet — Sprint 1: Authentication

Community Emergency Intelligence & Response Network.
This build delivers **login, registration and role-based accounts** (Citizen / Volunteer / Admin).

## What's included

- Landing page, sign in, registration, and a role-aware dashboard
- Three account types: **Citizen**, **Volunteer** (with skills + district), **Admin** (seeded)
- Passwords hashed with bcrypt — never stored in plain text
- Session-based login (8 hour sessions, regenerated on login)
- Server-side validation on every field + duplicate email detection
- Login throttling: 5 failed attempts → 10 minute lockout
- SQLite database using Node's **built-in** driver — zero setup, nothing to compile, created automatically on first run

## Setup (Windows)

1. Install Node.js from https://nodejs.org — **version 22.5 or newer** (Next → Next → Install)
2. Unzip this folder anywhere, e.g. `C:\Projects\resqnet`
3. Open PowerShell **inside the folder** (Shift + Right-click → "Open PowerShell window here")
4. Run:
   ```
   npm install
   npm start
   ```
5. Open http://localhost:3000 in your browser. Done.

The database file (`db/resqnet.db`) is created automatically the first time the server runs.

## Demo accounts

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@resqnet.lk  | Admin@2026 |

Create citizen/volunteer accounts through the Register page.

## Project structure

```
resqnet/
├── server.js            Express server + protected page routes
├── routes/auth.js       Register / login / logout / me (API)
├── db/database.js       SQLite schema + admin seed
└── public/
    ├── index.html       Landing page
    ├── login.html       Sign in
    ├── register.html    Create account (role selector, volunteer skills)
    ├── dashboard.html   Role-aware dashboard
    ├── css/style.css    Design system
    └── js/auth.js       Form handling
```

## Why SQLite (and how to move to MySQL later)

The database uses Node's built-in `node:sqlite` module — no database server to
install, no native compilation, no Visual Studio build tools needed. All queries
are standard SQL with prepared statements, so migrating to MySQL later only
means swapping `db/database.js` for a `mysql2` connection.

## Share it with your team (two ways)

### Option A — instant link from your own laptop (recommended for daily teamwork)
Your laptop stays the server; teammates get a temporary public link. Data stays in your
local database.

1. Download `cloudflared.exe` (Cloudflare Tunnel, free, no account needed):
   https://github.com/cloudflare/cloudflared/releases/latest → `cloudflared-windows-amd64.exe`
2. Keep ResQNet running (`npm start`) in one PowerShell window.
3. In a second PowerShell window, in the folder where you saved it:
   `.\cloudflared-windows-amd64.exe tunnel --url http://localhost:3000`
4. It prints a link like `https://something-random.trycloudflare.com` — send that to the
   team on WhatsApp. It works on their phones and laptops anywhere.

Notes: the link only works while both windows stay open, and the random address changes
each time you restart the tunnel — just share the new one.

### Option B — always-on hosting on Render (free tier)
Gives a permanent URL that works even when your laptop is off.

1. Put the project on GitHub (github.com → New repository → upload this folder, the
   included `.gitignore` keeps junk out). A commit history is also great Agile evidence.
2. Create a free account at https://render.com → New → Web Service → connect the repo.
3. Settings: Build command `npm install` · Start command `npm start` · Instance type Free.
4. Add an environment variable `SESSION_SECRET` set to any long random string.
5. Deploy — you get `https://resqnet.onrender.com`-style URL.

Free-tier caveats (fine for a student demo, mention them honestly in the report):
the service sleeps after ~15 minutes idle (first visit takes ~30 s to wake), and the
SQLite database is wiped whenever the service restarts or redeploys — so treat the
hosted copy as a shared demo, and keep the laptop copy as the source of truth.

## Credits

Hero photograph via Unsplash (free license) at `public/img/hero.jpg`; logged-in pages
use a US Forest Service wildfire photograph (public domain, via Openverse) at
`public/img/fire.jpg`. Both are bundled locally so the site works offline. Weather widget uses the free Open-Meteo API with a
static fallback when offline.

## New in this build — Sprint 1 complete

- **Incident reporting** (`/report`): emergency type cards (flood/fire/accident/medical),
  automatic GPS capture with accuracy readout and retry, optional description,
  resource-need tags (water/medical/evacuation/food), photo upload with preview (max 5 MB)
- **Severity auto-scoring**: type base score + keyword boost (e.g. "trapped", "rising fast")
- **Live incident map** (`/map`): Leaflet + OpenStreetMap dark tiles, colour-coded pulsing
  pins (red active / amber responding / green resolved), click a pin for full details with
  photo, auto-refreshes every 5 seconds
- **My reports** on the citizen dashboard with live status chips
- Leaflet is **bundled locally** (`public/vendor/leaflet`) — only map tiles need internet

### Why Leaflet instead of Google Maps
Google Maps requires an API key attached to a billing credit card even on the free tier.
Leaflet + OpenStreetMap is fully free, needs no key, and the map code is isolated in
`map.html` so swapping providers later is a contained change.

## Sprint 2 — Volunteer response system (this build)

- **Skill-matched alerts** (`/api/alerts`): flood → Flood Response/Search & Rescue,
  fire → Fire Safety/S&R, accident → Medical/S&R, medical → Medical. Logistics
  volunteers match anything with a resource request; Communications volunteers
  match escalated incidents. Volunteer dashboard shows "matched" vs "other".
- **"I'm responding"**: locks the incident (one responder at a time), pin turns amber
- **15-minute checkpoint**: live countdown on the incident page; miss it and the
  incident is auto-released back to active (escalated) for the next volunteer
- **10-minute no-response escalation**: severity bumps and the alert is flagged ESCALATED
- **Two-way chat** between reporter, responder and admins on every incident (4 s polling)
- **Resolve flow**: "genuine" → reporter trust +10 · "false report" → trust −25 (bounded 0–200)
- **Response history** on the volunteer dashboard
- Escalations run as a lazy sweep on reads — no cron or background jobs needed

## Sprint 3 — Organisation intelligence (this build)

- **Organisation dashboard** (`/admin`, admin only): live KPIs (total/active/responding/
  resolved/escalated/avg response time), refreshing every 10 s
- **Resource aggregation by district**: "25× water — Kandy" style rollups with bars
- **Hotspot districts** and **most-active volunteers** leaderboards
- **District detection** is fully offline — nearest-centroid lookup over all 25 districts,
  no geocoding API required
- **Cluster escalation rule**: 3+ active reports in the same ~5 km area within 30 minutes
  → the whole cluster jumps to severity High + ESCALATED
- **Broadcast warnings**: admin picks a district (or ALL) and sends a warning; citizens
  see it as a banner on their dashboard (production would feed the same data to an SMS
  gateway — transport swap only)
- **Public transparency feed** (`/feed`, no login): resolved incidents, anonymised, with
  response times — plus network totals
- **Post-incident report**: printable auto-generated report per resolved incident
  (`/api/incidents/:id/report`), linked from the incident page

## Sprint roadmap

- **Sprint 1:** Auth ✅ · Incident reporting + GPS + photo ✅ · Live map ✅
- **Sprint 2:** Volunteer dispatch ✅ · Skill matching ✅ · Check-in & escalation ✅ · Chat ✅ · Trust score ✅
- **Sprint 3 (this build):** Organisation dashboard ✅ · District aggregation ✅ · Cluster escalation ✅ · Broadcasts ✅ · Public feed ✅ · Post-incident reports ✅
- **Remaining (Could Have)**: WhatsApp/SMS gateway integration, AI risk heatmap overlay, evacuation routes
