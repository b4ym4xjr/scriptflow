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

### Scripts

- Rich text editor (TipTap) with formatting toolbar
- Status pipeline: Draft → Writing → Review → Ready to Film → Filming → Editing → Ready to Publish → Published → Archived
- Script metadata: title, description, tags, type, thumbnail notes, target publish date
- Auto-calculated word count and estimated read duration
- Search and filter by keyword, status, and type

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

- Generate a shareable read-only link (no login required)
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
| Styling    | Tailwind CSS + shadcn/ui     |
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
git clone https://github.com/your-username/scriptflow.git
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
│   ├── scripts/             # ViewScript, ScriptForm, CollaboratorsPanel, CommentsPanel, VersionHistoryPanel, SharePanel
│   └── ui/                  # shadcn/ui + custom components
├── db/
│   ├── schema.ts            # Drizzle schema + types
│   └── drizzle.ts           # DB client
└── lib/                     # Email helpers, token utils, validations
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

- Passwords hashed with Bcrypt
- All data access is gated by server-side auth checks
- Role enforcement in every server action (owner / editor / viewer)
- SQL injection protection via Drizzle-parameterized queries
- Input validation with Zod on all server action inputs
- Share tokens are cryptographically random (32-byte hex)
