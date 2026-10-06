# SchemeSetu

SchemeSetu helps people in India explore government schemes, compare basic eligibility, prepare an application checklist, and track their progress.

> SchemeSetu is an independent guide, not a government service. Its scheme descriptions and rule-based matches are informational only. Eligibility, benefits, documents, deadlines, and application routes can change and may depend on household, state, and scheme-specific records. Confirm every detail with the official scheme portal or department before applying.

## What it includes

- Public scheme directory with name, category, and state filters.
- Account registration and sign-in with password hashing and a secure, HTTP-only session cookie.
- Eligibility profile and deterministic profile-to-scheme screening rules.
- Match explanations and fit scores. AI is not used to decide eligibility.
- Saved-scheme tracker with status, private notes, and delete support.
- Gemini-generated application plans, requested only by the signed-in user and saved to that user's tracker.
- A seeded catalog of 25 central-government schemes. Run the seed command again safely to add any missing entries.

## Technology

- React, Vite, React Router, TypeScript, and TanStack Query.
- Express and Node.js API server.
- PostgreSQL with Drizzle ORM.
- OpenAPI specification and generated TypeScript API client and Zod schemas in `lib/api-spec` and `lib/api-client-react`.
- Google Gemini called only from the API server for application-plan generation.

## Data model

The database contains:

- `users`: email, display name, and bcrypt password hash.
- `profiles`: one eligibility profile per user.
- `schemes`: public scheme descriptions, rule fields, document lists, and official application URLs.
- `saved_schemes`: per-user status, notes, and generated application plans.

Foreign keys enforce user ownership and cascade cleanup when an account is removed. Passwords are never stored in plain text. Session tokens are signed on the server and delivered through an HTTP-only, SameSite cookie.

## Run locally

Use Node.js and pnpm from the repository root.

1. Configure the environment variables listed in `.env.example`.
2. Apply the Drizzle schema and seed the scheme catalog:

   ```sh
   pnpm --filter @workspace/db run push
   pnpm --filter @workspace/db run seed
   ```

3. Start the API and web app with the configured Replit workflows, or run:

   ```sh
   pnpm --filter @workspace/api-server run dev
   pnpm --filter @workspace/scheme-setu run dev
   ```

The API is mounted under `/api`. The root `pnpm run typecheck` command checks shared libraries and workspace applications.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `GEMINI_API_KEY`: Google AI Studio key used by the API server for application-plan generation.
- `JWT_SECRET`: signing secret for session tokens. If omitted, the API uses `SESSION_SECRET`.
- `SESSION_SECRET`: fallback signing secret for session tokens.

Keep actual credentials in Replit Secrets or a local environment file that is not committed. Never place them in client-side code.

## Eligibility and privacy notes

Matching compares the profile fields the user supplies against simple scheme rules such as age, income, state, gender, occupation, student, farmer, and disability flags. Some real schemes use family-level records, official beneficiary lists, application windows, or an either/or condition that a small profile cannot represent. A match is not an approval or a promise of benefits, and an absent match does not prove ineligibility.

Application-plan generation sends only the selected scheme's catalog details to Gemini. It does not send the user's profile, account password, or session token, and it is explicitly instructed not to make eligibility decisions. The Gemini credential remains server-side.
