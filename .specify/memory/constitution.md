<!--
  Sync Impact Report:
  Version change: 0.0.0 → 1.0.0 (initial constitution creation)
  New file, all sections populated from existing project context
  Templates reviewed: spec-template.md, plan-template.md, tasks-template.md — all compatible
-->

# NodeWarden Constitution

## Core Principles

### I. Security-First
Every feature MUST treat user secrets as the highest priority. Encryption keys, master passwords, and authentication tokens MUST NEVER be logged, exposed in error messages, or stored in plaintext. All cryptographic operations MUST use Web Crypto API or @noble/hashes — no ad-hoc crypto. JWT_SECRET MUST be at least 32 random characters in production. Provider credentials (WebDAV, S3 backup targets) MUST follow the encrypted settings pattern in `backup-settings-crypto.ts`.

### II. Bitwarden Compatibility
The API layer MUST maintain compatibility with official Bitwarden clients. Cipher and sync handlers MUST preserve unknown client fields — do not strip fields that the web vault does not use. Changes to `/api/ciphers`, `/api/sync`, or vault item shape MUST be tested against at least one official client. When adding new endpoints, prefer Bitwarden API conventions unless explicitly documented otherwise.

### III. Frontend Quality (PWA-First)
The web vault MUST work as a Progressive Web App: installable, functional offline, and performant. All user-visible text MUST go through the i18n system (`t('txt_xxx')`) with both `en.ts` and `zh-CN.ts` translations added. UI changes MUST NOT break PWA caching or offline mode. Design MUST follow `docs/vault-editor-design-spec.md` when applicable.

### IV. Data Integrity
Database schema changes require: (a) update `storage-schema.ts`, (b) add migration SQL to `migrations/`, (c) bump `STORAGE_SCHEMA_VERSION` in `storage.ts`, (d) decide whether new data belongs in backup whitelist. Backup export/import is whitelist-based — never export runtime lock rows (`backup.runner.lock.v1`) or retired sensitive fields (`users.api_key`).

### V. Minimal, Focused Changes
Keep PRs small and focused. Each commit or PR MUST address a single concern — do not mix refactors with feature work or bug fixes. When cleanup is needed before a fix, document it separately. Prefer reading existing code patterns over reinventing abstractions. Three similar lines are better than a premature abstraction.

## Security Requirements

All authentication MUST use one of: WebAuthn/FIDO2 (Passkey), TOTP (as second factor), or JWT-based session tokens. Session tokens MUST have bounded lifetimes. API keys for user accounts MUST be hash-stored, never plaintext. Rate limiting SHOULD be applied to login and registration endpoints. Cross-origin requests MUST validate origin against allowed domains.

## Development Workflow

1. **Research** — Understand the codebase area before making changes
2. **Plan** — Use Spec Kit `/speckit.plan` before starting implementation
3. **Implement** — Write code following the constitution principles
4. **Review** — Verify compliance with Security-First, compatibility, and data integrity rules
5. **Ship** — Squash-merge to main for a clean linear history

Commits MUST follow Conventional Commits (`feat:`/`fix:`/`refactor:`/`chore:`). At least one commit per hour of work. After changes to locale files, run `npm run i18n:validate`.

## Governance

This constitution supersedes all ad-hoc development practices. Amendments require a documented proposal, team review, and a migration plan for any impacted code. PRs and code reviews MUST verify compliance with the five core principles. Complexity MUST be justified by user-facing value.

**Version**: 1.0.0 | **Ratified**: 2026-06-17 | **Last Amended**: 2026-06-17