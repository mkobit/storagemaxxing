## Context

`apps/web`'s static build output has always been required to be hostable on Cloudflare Pages
(`vite-web-foundation` spec), but deployment was never wired up until this change (tracked as
sm-clni/sm-5j1g). While provisioning Cloudflare interactively, the dashboard's own "Upload
assets" flow routed new static-site creation through Workers + static assets, with an in-UI
warning to use `wrangler deploy` instead of `wrangler pages deploy`. This reflects Cloudflare's
ongoing consolidation of Pages into Workers static assets — new projects are steered there by
default; classic Pages is the legacy path. The manual bootstrap deploy already landed: a Worker
named `storagemaxxing-web` is live at `https://storagemaxxing-web.mkobit-cloudflare.workers.dev`
(verified `curl -sI` returns `HTTP/2 200`). This design covers formalizing that as the spec'd
hosting target and wiring the remaining CI automation.

This is infrastructure/deploy tooling only — no domain objects, no `packages/*` changes, no Zod
schemas involved, so the "Zod schemas for new domain objects" design rule does not apply here.

## Goals / Non-Goals

**Goals:**

- Reword `vite-web-foundation`'s "Static Build Output" requirement so it no longer names
  "Cloudflare Pages" specifically, matching the platform Cloudflare actually directs new
  projects to.
- Add a GitHub Actions step that builds `apps/web` and deploys it via `wrangler deploy` on
  every push to `main`.
- Document the manual, non-automatable follow-up (API token permission scope) so it isn't
  silently assumed to be CI's job.

**Non-Goals:**

- Migrating any existing classic Cloudflare Pages project (none exists — this repo never had
  one; the dashboard routed us straight to Workers static assets on first attempt).
- PR preview deployments or a custom domain (both explicitly deferred in sm-5j1g's original
  scope; unaffected by the Pages→Workers pivot).
- Any change to `packages/geometry`, `catalog`, `assembly`, `packer`, or `store` — this change
  does not touch the lint-enforced package DAG.

## Decisions

- **Workers static assets over classic Pages**: Cloudflare's own dashboard UI and current docs
  steer new projects to Workers static assets; classic Pages is the legacy path. Building on
  the currently-recommended platform avoids adopting a path Cloudflare itself is deprecating.
- **`wrangler deploy` + `wrangler.jsonc` over `cloudflare/wrangler-action`**: matches this
  repo's existing convention of pinned devDependencies invoked via plain `run:` steps (vite,
  playwright, storybook are all handled this way) rather than adding a third-party Action to
  track and SHA-pin. `wrangler` is already an `apps/web` devDependency (landed in PR #346).
- **Deploy on push to `main` only, not on PRs**: avoids deploying unreviewed code and conserves
  Cloudflare's build/request allowances, consistent with sm-5j1g's original scope.
- **Token permission broadening is a manual step, not CI-automatable**: the existing
  `CLOUDFLARE_API_TOKEN` (scoped to `Cloudflare Pages:Edit`) cannot self-elevate its own scope
  to `Workers Scripts:Edit` — that requires a human editing the token (or issuing a new one) in
  the Cloudflare dashboard. The CI deploy step will fail authentication until this happens; this
  design does not attempt to work around that.

## Data Flow

```
git push origin main
        │
        ▼
GitHub Actions (ci.yml, deploy job)
        │
        ├─ bun run --cwd apps/web build   → apps/web/dist/
        │
        └─ bunx wrangler deploy           → reads apps/web/wrangler.jsonc
                │                            (assets.directory: ./dist)
                │  auth: CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
                ▼
     Cloudflare Worker "storagemaxxing-web"
     (static assets, no server-side Worker script)
                │
                ▼
     https://storagemaxxing-web.mkobit-cloudflare.workers.dev
```

## Risks / Trade-offs

- **Token permission gap blocks CI on first run**: the deploy job will fail until a human adds
  `Workers Scripts:Edit` to the token or issues a replacement. Mitigation: call this out
  explicitly in the PR description and as a tasks.md step, not just in this design doc.
- **`*.workers.dev` subdomain has no custom domain**: acceptable per Non-Goals; can be added
  later without changing the deploy mechanism.
- **Manual bootstrap deploy vs. CI-driven deploy could drift**: the Worker already deployed
  manually via `bunx wrangler deploy` from a local machine. The next CI-driven deploy will
  overwrite it with whatever is on `main` at that time, which is the desired behavior (CI
  becomes the source of truth going forward), not a conflict.

## Adversarial Audit

- **Failure mode: CI deploy step runs before the token is re-scoped.** The workflow step will
  fail with a Cloudflare authentication/permission error (not a silent no-op). This is expected
  and acceptable — it produces a clear, actionable CI failure rather than a masked deploy
  failure. tasks.md must not mark the CI-wiring task done until a real green run is observed
  post-token-fix, not just "the YAML is syntactically valid."
- **Failure mode: `wrangler.jsonc`'s `compatibility_date` silently drifts stale.** Not a
  deploy-breaking issue (Workers tolerates old compatibility dates), but worth a one-line note
  in tasks.md rather than a recurring bead, since it's low-severity and not time-boxed.
- **Sync conflict: two sources of truth for the Worker name.** `apps/web/wrangler.jsonc`'s
  `"name"` field and the Cloudflare dashboard project name must match (`storagemaxxing-web`).
  Verified already — the manual `wrangler deploy` run used this exact `wrangler.jsonc`, so
  there's no drift to reconcile.
- **Claim verification**: "wrangler is already an apps/web devDependency" was verified by
  reading `apps/web/package.json` directly (PR #346, `"wrangler": "^4.118.0"`), not inferred.
  "The Worker is live" was verified via `curl -sI` returning `HTTP/2 200`, not assumed from the
  `wrangler deploy` CLI output alone.
