# Skill Registry — Derinator

Generated: 2026-07-01

## User Skills

| Skill | Trigger | Compact Rules |
|-------|---------|---------------|
| interface-design | UI components, dashboards, apps | Match aesthetic to context, no generic AI slop |
| component-audit | After building components, UI consistency | Audit states, tokens, a11y — not features |
| judgment-day | "judgment day", adversarial review | Dual blind judge agents, fix until pass |
| go-testing | Go tests, Bubbletea TUI | teatest patterns (not applicable here) |
| skill-creator | Create new AI skills | Follow Agent Skills spec |
| branch-pr | Creating PRs | Issue-first enforcement |
| issue-creation | Creating GitHub issues | Issue-first enforcement |

## Project Conventions

| Source | Path |
|--------|------|
| CLAUDE.md (project) | `CLAUDE.md` |
| CLAUDE.md (user) | `~/.claude/CLAUDE.md` |

## Compact Rules

### Project Stack
- TypeScript monorepo (npm workspaces): frontend (React 18 + Vite) + backend (Express 4 + PostgreSQL)
- Testing: Vitest + jsdom + Testing Library (frontend), Vitest + supertest + pg-mem (backend), Playwright (E2E)
- Linting: ESLint + Prettier
- Architecture: Container/presentational (frontend), Hexagonal (backend)
- API contract uses snake_case — do not camelCase
- Offline-first: game works without backend
- Deploy: Vercel (frontend), Render (backend)
