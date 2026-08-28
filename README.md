# AP Blitz

Student-run AP education org. Public recruitment site + private team workspace.

This is where AP Blitz operates: apply → get accepted → set up an account → messages, calendar, tasks, content pipeline, daily logs, meetings.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- PostgreSQL + Prisma
- Session auth (httpOnly cookies, hashed passwords, DB sessions)
- File uploads on disk (swap later for S3/R2)
- Email via SMTP env vars (logs to console if SMTP is unset)

## Setup

1. Install Docker Desktop (for Postgres) and Node 20+.
2. Copy env and set a real secret + founder password:

```bash
cp .env.example .env
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

3. Start the database and seed:

```bash
npm run db:up
npm run db:setup
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Postgres is mapped to **port 5433** so it doesn't collide with other local databases.

## Default local logins

Set in `.env` (seed uses these):

- **Founder:** `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` (defaults to kesavgarg@gmail.com)
- **Demo team** (if `SEED_DEMO=true`): `maya@apblitz.local`, `jordan@apblitz.local`, `sam@apblitz.local`, `riley@apblitz.local`, `alex@apblitz.local`, `taylor@apblitz.local`  
  Password: `BlitzMember!2026`

Change the founder password before this is public.

## Founder video

Paste a YouTube URL in **Admin → Settings**. The homepage embed updates immediately. Direct `.mp4` URLs work too.

## Email

Without SMTP, confirmations still send — they print to the terminal. Set:

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=AP Blitz <hello@apblitz.org>
```

## Routes

- `/` public site
- `/join` and `/join/[role]` role pages
- `/apply` application form
- `/login` team login
- `/setup-account` invite link from acceptance email
- `/workspace` team HQ
- `/admin` founder / team-admin control center

Applications are never public. Changing a URL id still hits a server-side permission check.

## Production notes

- Use a real Postgres (`DATABASE_URL`)
- Put uploads on object storage
- Set `AUTH_SECRET` and a strong founder password
- Serve over HTTPS so session cookies are `Secure`
