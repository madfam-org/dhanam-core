# Dhanam Core

**The AGPLv3 open core of [Dhanam](https://github.com/madfam-org) — a personal‑finance app for budgeting, tracking your finances & assets, and planning your wealth.**

Dhanam Core is a self‑hostable monorepo containing the domain heart of Dhanam:
a NestJS API, a Next.js web app, and shared TypeScript packages. It is the part
of Dhanam that is genuinely about *managing your own money* — and nothing else.

> **License:** GNU Affero General Public License v3.0 or later (`AGPL-3.0-or-later`).
> Copyright © 2025‑2026 Innovaciones MADFAM S.A.S. de C.V. See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).

---

## What's included

**API modules** (`apps/api`)

- **Auth** — local email/password with JWT + refresh‑token sessions and TOTP 2FA, plus read‑only guest sessions.
- **Spaces & households** — personal/business spaces, household members, roles.
- **Accounts & transactions** — manual accounts and balances, transactions, splits, rules, tags, category corrections, "Yours/Mine/Ours" sharing.
- **Budgets & categories** — zero‑based budgeting, income events & allocations, category funding goals.
- **Recurring & subscriptions** — recurring‑transaction detection and subscription (recurring‑spend) tracking.
- **Assets** — manual assets (real estate, vehicles, private equity, collectibles), valuations, and PE cash‑flows.
- **Goals & simulations** — financial goals with Monte‑Carlo probability, goal sharing/activity, and a probabilistic simulation engine (retirement, safe‑withdrawal, scenario analysis).
- **Estate planning** — wills, beneficiary designations, executors, and the "Life Beat" inactivity/executor‑access flow.
- **Documents & reports** — uploads (S3/R2), CSV import, saved/generated reports and sharing, cashflow forecasts.
- **FX** — currency conversion and rate storage (Banco de México / public sources).
- **Analytics, search, onboarding, preferences, users** — the supporting core surfaces.

**Web app** (`apps/web`) — the finance / budget / asset / planning UI (accounts, transactions, budgets, assets, goals, projections, reports, settings, onboarding), built on the shared design system.

**Packages** (`packages/*`) — `shared` (types, i18n, utils), `ui` (design‑system components), `simulations` (the Monte‑Carlo / scenario engines), and `config` (shared TS/ESLint configs).

## What's intentionally **not** included (and why)

Dhanam Core is a deliberate, allowlist‑built subset. The proprietary and
operational parts of the product are **not** in this repository:

- **Billing, subscriptions, pricing & payment processors** — the monetization layer and all payment-processor integrations.
- **Account aggregation connectors** — open‑banking / exchange integrations (e.g. bank/exchange providers). Dhanam Core tracks accounts entered manually or imported from CSV/statements; the "connect a bank" flow is a compatibility stub.
- **KYC/AML, ESG scoring, ML category prediction, transaction execution/orders, marketplace, referrals** — proprietary product surfaces.
- **Automated collectibles valuation** — the market-valuation service and its third‑party price connectors are not in the open core; manual collectible assets (entered with a user‑set value) remain fully supported.
- **SSO** — the production build authenticates via an external OIDC provider; Dhanam Core ships **local** JWT auth instead.
- **Email templates & transports** — replaced by a no‑op mailer stub you can wire to your own transport.
- **Background job processors** — replaced by a no‑op queue stub.
- **All deployment/infra** — Kubernetes/ArgoCD/CI manifests, internal registries, and secrets. There are none here; bring your own.
- **Any real data** — no seeds, no demo dataset, no personal financial data.

Where a core module used to call into one of the excluded pieces, the dependency
was severed cleanly (feature dropped, or interface stubbed with a clear note in
the source). See the module‑level comments and the mailer/queue/feature‑gate
stubs under `apps/api/src/core/`.

## Architecture

```
dhanam-core/
├── apps/
│   ├── api/          # NestJS + Fastify + Prisma (PostgreSQL) + Redis
│   └── web/          # Next.js (App Router) + React Query + Tailwind
└── packages/
    ├── shared/       # Types, i18n, utilities
    ├── ui/           # Design-system components
    ├── simulations/  # Monte-Carlo / scenario engines
    └── config/       # Shared tsconfig / eslint
```

## Getting started

**Prerequisites:** Node ≥ 20, pnpm ≥ 8, PostgreSQL, Redis.

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env
#   → edit .env and set DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY, …
#   (see .env.example for every variable and which are optional)

# 3. Create the database schema
#    dhanam-core ships NO migrations — push the schema directly:
pnpm db:generate     # generate the Prisma client
pnpm db:push         # create tables from apps/api/prisma/schema.prisma
#    (or author your own migration: cd apps/api && pnpm prisma migrate dev --name init)

# 4. Run
pnpm dev             # api on :4000, web on :3000
```

## Build status — please read

This repository is an **honest, allowlist‑built extraction**, not a turnkey
release. Its guarantees, in priority order, are:

1. **No leaks.** Nothing proprietary, secret, internal, or personal was copied.
2. **A coherent core** that represents budgeting, tracking, and planning.
3. **Best‑effort buildability.**

Because entanglements with the excluded pieces were severed by stubbing and
dropping sub‑features, **the project is not guaranteed to compile end‑to‑end as
shipped.** Expect to run `pnpm install`, `pnpm db:generate`, and a typecheck
pass and to fix residual references (a handful of dropped‑feature call sites,
unused imports, and translation keys) before everything is green. The Prisma
schema validates (`prisma validate`) and the API/web trees have been scrubbed of
all excluded‑module imports and internal hostnames.

Contributions that finish wiring the open core into a fully green build are
welcome.

## Contributing & license

By contributing you agree your contributions are licensed under
`AGPL-3.0-or-later`. If you run a modified version of this software as a network
service, the AGPL requires you to offer its complete source to your users.
