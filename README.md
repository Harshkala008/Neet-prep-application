# NEET Master Tracker Pro

Phase 1 establishes the monorepo foundation for the NEET UG 2026
preparation operating system.

## Current phase

- `apps/web`: Next.js App Router shell with a responsive dashboard starter.
- `apps/api`: Express API health endpoint with strict request configuration.
- `packages/shared`: Shared Zod schemas, syllabus seed, progress math, and
  status derivation for web/API parity.
- Root environment, formatting, workspace, and CI configuration.

The syllabus seed is extracted from the inspected reference app and records
the NMC/UGMEB NEET (UG) 2026 source metadata. Run `pnpm seed:validate` to
verify 20 Physics units/147 topics, 20 Chemistry units/121 topics, and
10 Biology units/74 topics (50 units/342 topics total).

`packages/shared/src/progress.ts` contains pure progress math. It preserves
the original 12-resource topic model, excludes N/A resources from
denominators, maps the subject-specific DPP, and derives topic status.

## Setup

```text
pnpm install
copy .env.example .env
pnpm dev
```

The web app runs on `http://localhost:3000`; the API runs on
`http://localhost:4000`.

## Deploy a public Firebase link

The web app is configured for Firebase Hosting static export. The deployed
site will use a URL such as `https://your-project-id.web.app`.

1. Install the Firebase CLI once:

   ```text
   npm install -g firebase-tools
   ```

2. Log in and create/select a Firebase project:

   ```text
   firebase login
   firebase projects:create your-project-id
   firebase use --add
   ```

   Select the project when prompted. This creates the local Firebase project
   association; do not commit credentials.

3. Build and deploy from the repository root:

   ```text
   pnpm install
   pnpm build
   firebase deploy --only hosting
   ```

4. Open the URL printed by Firebase, normally:

   ```text
   https://your-project-id.web.app
   ```

This deployment currently stores each user's progress in that browser's
localStorage. Firebase Authentication and cloud synchronization are not yet
enabled.

## Deploy on Render

Alternatively, create a Render **Static Site** from this repository. The
included `render.yaml` supplies the configuration automatically:

- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Publish directory: `apps/web/out`
- URL: Render will provide a `*.onrender.com` address after the first deploy

In Render, connect the repository, choose **Blueprint** if prompted, and select
the `render.yaml` file. If creating the Static Site manually, use the same
build command and publish directory.

## Commands

```text
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## Scope and assumptions

- Signed-out local-first behavior is the product baseline.
- Firebase Auth, MongoDB, and AI credentials are configured in later phases.
- Shared validation is centralized so browser and API inputs cannot drift.
