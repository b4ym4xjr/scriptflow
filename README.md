# ScriptFlow

A collaborative script workflow platform for video creators. Write scripts, track production stages, review with your team, manage versions, and ship
videos faster.

---

## Features

### Authentication

- Email/password sign-up with email verification
- Forgot/reset password flow via email
- JWT sessions (30-day expiry)
- Bcrypt password hashing

### Dashboard

- Live stats strip (total, in production, due this week, published)
- **Grid, list and Kanban board views** (choice is remembered); drag cards between columns to change status
- Instant client-side search, status chips, type filter and sorting (title, updated, due date, status)
- One-click status changes from any card, with optimistic updates and confetti on publish
- **Command palette** (`⌘K` / `Ctrl+K`) to jump to scripts, switch views, create a script or toggle the theme
- Keyboard shortcuts: `/` search, `N` new script, `⌘K` palette

### Scripts

- Rich text editor (TipTap) with icon toolbar, live word / character count and on-camera time estimate
- Status pipeline: Draft → Writing → Review → Ready to Film → Filming → Editing → Ready to Publish → Published → Archived, shown as a stepper
- Script metadata: title, description, tags, type, thumbnail notes, target publish date (with overdue / due-soon indicators)
- **Teleprompter mode**: full-screen reading view with countdown, adjustable speed and size, mirror mode, reading guide, and on-screen notes toggle (`Space` play/pause, `↑/↓` speed, `+/-` size, `M` mirror, `R` restart)
- **Focus mode** in the editor (`⌘⇧F`, `Esc` to exit)
- **Draft autosave**: unsaved edits are kept locally and offered for restore after a refresh or crash; `⌘S` to save

### Look & feel

- Light and dark themes (follows the system by default) with a no-flash loader
- Minimalist design with exactly three color roles: a warm-neutral **theme** (paper / ink), one indigo **primary**, and a soft **secondary** tint. Status is conveyed by icon, label and a single-hue progress ramp rather than a rainbow
- Subtle motion only: fades, staggered lists and layout transitions; skeleton loaders
- Respects `prefers-reduced-motion`

### Collaboration

- Invite team members by email as **Viewer** (read-only) or **Editor** (full edit access)
- Shared scripts appear in "Shared with me" on the dashboard
- Role-based access enforced server-side

### Version History

- Snapshot saved automatically on every update
- Revert to any previous version (owner/editor only)

### Comments

- Threaded comments on each script
- Delete your own comments; owners can delete any comment
- Email notification to the script owner when a collaborator comments

### Notifications

- In-app notification bell with unread count
- Notifications for: new comment, collaborator added, status change
- Marks all as read on open

### Public Share Links

- Generate a shareable read-only link (no login required) at `/s/<token>`
- Revoke at any time

### Email Notifications

- Status change alerts sent to all collaborators
- Comment notifications sent to a script owner
- Powered by Resend

### Mobile Layout

- Script editor switches to a Content/Details tab layout on small screens
- Dashboard is fully responsive

---

## Tech Stack

| Layer      | Technology                   |
|------------|------------------------------|
| Framework  | Next.js 16 (App Router)      |
| Language   | TypeScript                   |
| Styling    | Tailwind CSS v4 + shadcn/ui  |
| Animation  | Motion (`motion/react`)      |
| Editor     | TipTap                       |
| Auth       | NextAuth (credentials)       |
| Database   | PostgreSQL (Neon serverless) |
| ORM        | Drizzle ORM                  |
| Email      | Resend                       |
| Validation | Zod + React Hook Form        |
| Deployment | Vercel                       |

---

## Quick Start

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Neon recommended)
- A Resend account for emails

### Installation

```bash
git clone https://github.com/b4ym4xjr/scriptflow.git
cd scriptflow
npm install
cp .env.example .env.local
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Auth
AUTH_SECRET=your-secret-key          # generate: npx auth secret

# App URL (used in emails and share links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Database Setup

```bash
npx drizzle-kit push
```

### Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Database Schema

| Table                  | Purpose                                              |
|------------------------|------------------------------------------------------|
| `users`                | Accounts, verification tokens, password reset tokens |
| `scripts`              | Script content, metadata, status, share token        |
| `script_collaborators` | Per-script access control (VIEWER / EDITOR)          |
| `script_versions`      | Version snapshots saved on each update               |
| `script_comments`      | Comments on scripts                                  |
| `notifications`        | In-app notifications                                 |

---

## Project Structure

```
├── app/
│   ├── (auth)/              # Sign in, sign up, verify email, forgot/reset password
│   ├── (root)/              # Protected dashboard + script pages
│   └── s/[token]/           # Public read-only share page (no auth)
├── actions/                 # Server actions (auth, scripts, collaborators, comments, versions, share, notifications)
├── components/
│   ├── dashboard/           # Dashboard, BoardView, StatsStrip
│   ├── auth/                # Auth page building blocks
│   ├── scripts/             # ViewScript, ScriptForm, Teleprompter, ScriptCard, collaboration / comments / version / share panels
│   └── ui/                  # shadcn/ui + custom components (editor, dialog, ...)
├── db/
│   ├── schema.ts            # Drizzle schema + types
│   └── drizzle.ts           # DB client
└── lib/                     # Email helpers, token utils, validations, script metadata (status / due helpers)
```

---

## Development

```bash
npm run dev   # Dev server
npm run build      # Production build
npm run lint       # ESLint
npx drizzle-kit push        # Push schema changes
npx drizzle-kit generate    # Generate migration files
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from the list above
4. Deploy — Vercel auto-runs `npm run build`

---

## Security

**Authentication & accounts**
- Passwords hashed with bcrypt (cost 12); policy (8–72 chars, upper/lower/number) enforced **server-side**, not just in the form
- Email verification and password-reset tokens are 256-bit random values and only their SHA-256 hash is stored, so a database leak can't yield working links
- Sign-in does the same bcrypt work whether or not the account exists (no timing-based account discovery); emails are matched case-insensitively
- Password reset also verifies the mailbox, and re-registering an unverified address replaces the earlier registration (blocks "pre-hijacking" an email)
- Rate limiting on sign-in (including the raw `/api/auth` endpoint), sign-up, verification, password reset, comments and invites. State is in-memory per server instance, so on serverless hosts treat it as a best-effort brake and put a shared store or your platform's WAF in front for hard limits

**Authorization & input**
- Every server action checks the session and the caller's role (owner / editor / viewer) before touching data
- Internal helpers (e.g. notification creation) live outside `"use server"` files so they are not publicly callable
- All inputs are type- and size-limited server-side; IDs and tokens are shape-checked before reaching the database; queries are parameterised (Drizzle)
- The owner's public share token is never sent to collaborators, and the public share endpoint returns only the fields it renders
- Rich text is rendered through TipTap's schema (unknown tags/attributes are dropped) and the teleprompter builds React nodes from parsed text, never `innerHTML`
- Email templates HTML-escape all user content; subjects are stripped of line breaks

**Transport & browser hardening**
- Content-Security-Policy (no plugins, no framing, same-origin forms / network / images / fonts), HSTS with preload, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, COOP, locked-down Permissions-Policy, no `X-Powered-By`
- Share tokens are cryptographically random (32-byte hex) and revocable at any time

**Known limitations**
- Sessions are stateless 30-day JWTs, so a password reset does not sign out other devices
- `script-src` still allows `'unsafe-inline'` (Next.js bootstrap scripts); per-request nonces are the next hardening step
- Run `npm audit` regularly; remaining advisories are in dev-only tooling (`drizzle-kit`, lint chain)
