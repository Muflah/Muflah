INSTRUCTIONS FOR AI AGENTS: Before starting work in `auth/`, read this file—especially the most recent 3–5 entries—to understand what changed recently and which files or scope were affected. After completing a change, append a new entry here using the fields below.

Each entry contains:

- `Timestamp and title`: when the work happened and a concise description of the task.
- `Agent`: the agent or person who performed the work.
- `Model`: the model used, when applicable.
- `Prompt Summary`: a short summary of the requested work.
- `Changes Made`: the meaningful implementation, documentation, or decision changes.
- `Files`: files created, modified, or removed.
- `Verification Status`: checks performed, their results, and anything still pending.

# 2026-10-15T18:18:33Z — Define Initial Authentication Scope

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Establish the initial scope for a reusable authentication and session system.
- Changes Made: Documented risk-based OTP verification, login and signup, account switching with multi-session support, JWT authentication, and domain-wide cookies issued from the `auth` subdomain. Documented initial security constraints and out-of-scope areas.
- Files: `README.md`, `AGENTS.md`, `CHANGELOG.md`, and `AGENTLOG.md`.
- Verification Status: `git diff --check` passed. No implementation code or automated tests were run.

# 2026-10-16T00:18:00+05:00 — Install Vanilla Better Auth Baseline

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Start the auth service with a vanilla Better Auth install and prepare a basic signup/login test for Vercel.
- Changes Made: Added a minimal Next.js service, PostgreSQL-backed Better Auth configuration, email/password signup and login, the Better Auth catch-all API route, a basic HTML/CSS test page, environment templates, migration tooling, and package scripts.
- Files: `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `.env.example`, `.gitignore`, `src/better-auth/auth.ts`, `src/app/`, `README.md`, `AGENTS.md`, `CHANGELOG.md`, and `AGENTLOG.md`.
- Verification Status: `npm run typecheck` passed. `npm run build` passed with temporary build environment values; schema validation logged the expected database-connection warning because no real PostgreSQL database was configured. Vercel deployment and signup/login verification remain pending real database credentials and Vercel access.

# 2026-10-16T00:42:04+05:00 — Configure Local Auth Database and Secret

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Configure the local auth environment for the requested domain and database, then prepare it for deployment.
- Changes Made: Preserved the user-provided PostgreSQL connector in the ignored `.env`, generated a private Better Auth secret, set `BETTER_AUTH_URL` to `https://auth.muflah.com`, added the module type declaration, and applied the initial Better Auth PostgreSQL migration.
- Files: `.env`, `package.json`, `package-lock.json`, and `AGENTLOG.md`; the configured database schema was also updated with the initial Better Auth tables.
- Verification Status: Better Auth migration completed successfully; `npm run typecheck` passed; `npm run build` passed. Vercel deployment and remote signup/login remain pending Vercel authentication and environment-variable configuration.

# 2026-10-15T18:59:23Z — Add Planned Module Placeholders

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Create the complete planned folder structure for the auth service, including future modules.
- Changes Made: Added placeholder directories for the modular monolith's Better Auth integration, API, accounts, sessions, OTP, risk, tokens, cookies, database, integrations, configuration, future authorization, audit, migrations, and test layers. Documented that these are internal module boundaries within one deployable service.
- Files: `README.md`, `CHANGELOG.md`, `AGENTLOG.md`, and placeholder `.gitkeep` files throughout `src/`, `migrations/`, and `tests/`.
- Verification Status: `git diff --check` passed. No implementation code or automated tests were run.

# 2026-10-15T18:43:51Z — Plan Future Authorization Module

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Document the decision to add roles and permissions later as a separate auth module.
- Changes Made: Distinguished authentication from authorization and documented a future authorization module for roles, permissions, memberships, and policy checks. Kept authorization outside the first implementation and excluded mutable authorization data from initial JWTs.
- Files: `README.md`, `AGENTS.md`, `CHANGELOG.md`, and `AGENTLOG.md`.
- Verification Status: `git diff --check` passed. No implementation code or automated tests were run.

# 2026-10-15T18:30:21Z — Document Service Architecture and Release Model

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Record the architecture and delivery preferences for the reusable authentication service.
- Changes Made: Documented the self-hosted service model, Better Auth as an external runtime dependency, the separation between Better Auth integration and reusable implementation, standard HTTP/JSON APIs, cookie and JWT client paths, unversioned compatibility-first API evolution, and rolling-release compatibility requirements.
- Files: `README.md`, `AGENTS.md`, `CHANGELOG.md`, and `AGENTLOG.md`.
- Verification Status: `git diff --check` passed. No implementation code or automated tests were run.

# 2026-10-15T19:01:05Z — Move Authorization Ownership to Applications

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Clarify that consuming applications, rather than the auth service, own roles and permissions.
- Changes Made: Updated the architecture documentation to keep the auth service responsible for identity and sessions only. Removed the planned authorization module placeholders and clarified that applications own roles, permissions, memberships, and policy checks.
- Files: `README.md`, `AGENTS.md`, `CHANGELOG.md`, `AGENTLOG.md`, and the removed authorization placeholder files under `src/authorization/`.
- Verification Status: `git diff --check` passed. No implementation code or automated tests were run.

# 2026-10-15T19:03:22Z — Add Direct-Access Auth Interface Scope

- Agent: Codex
- Model: GPT-5
- Prompt Summary: Add a simple HTML and CSS interface for direct visits to the auth subdomain.
- Changes Made: Added placeholder web template and static-style directories. Documented a minimal server-rendered interface for signup, login, OTP entry, logout, and status/error pages, while keeping product integrations on the JSON API.
- Files: `README.md`, `AGENTS.md`, `CHANGELOG.md`, `AGENTLOG.md`, `src/web/templates/.gitkeep`, and `src/web/static/.gitkeep`.
- Verification Status: `git diff --check` passed. No implementation code or automated tests were run.

