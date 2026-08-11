## Why

`apps/web`'s static build output has always been required to be hostable on Cloudflare Pages
(`vite-web-foundation` spec, "Static Build Output" requirement), but that requirement was never
wired into deployment (tracked as sm-clni/sm-5j1g).
While provisioning it interactively, Cloudflare's dashboard routed new static-site creation
through its unified Workers + static assets upload flow instead of a classic Pages project,
with an explicit in-UI warning to use `wrangler deploy` rather than `wrangler pages deploy`.
Cloudflare has been consolidating Pages into Workers since 2024/2025 and now steers new
projects toward Workers static assets by default; classic Pages is the legacy path.
The spec's literal wording ("hostable on Cloudflare Pages") no longer matches the platform
Cloudflare itself directs new projects to, so the requirement needs rewording before the
remaining CI wiring work closes it out.

## What Changes

- Reword the `vite-web-foundation` spec's "Static Build Output" requirement to require
  hosting on Cloudflare's static-asset hosting generally, rather than naming the "Cloudflare
  Pages" product specifically.
- Document that `apps/web` is deployed as a Cloudflare Worker with static assets
  (`apps/web/wrangler.jsonc`, `assets.directory: ./dist`), deployed via `wrangler deploy`,
  not `wrangler pages deploy`.
- Add a GitHub Actions step (push to `main` only) that runs `bun run --cwd apps/web build`
  then `bunx wrangler deploy`, using the `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` repo
  secrets already provisioned under sm-clni.
- Flag as a manual follow-up (not CI-automatable): the existing `CLOUDFLARE_API_TOKEN` is
  scoped to `Cloudflare Pages:Edit` only and needs `Workers Scripts:Edit` added (or a
  replacement token issued) before the CI deploy step can authenticate successfully.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `vite-web-foundation`: the "Static Build Output" requirement's hosting target changes from
  "Cloudflare Pages" specifically to Cloudflare's static-asset hosting (Workers + static
  assets).

## Impact

- Affected package: `apps/web` only (no changes to `packages/geometry`, `catalog`, `assembly`,
  `packer`, or `store` — this is deployment/CI tooling, not application logic, so it does not
  touch the lint-enforced package DAG).
- Affected files: `apps/web/wrangler.jsonc` (new, already added), `apps/web/package.json`
  (`deploy` script, already changed), `.gitignore` (`.wrangler/`, already added), and a new
  or modified `.github/workflows/*.yml` step (pending).
- Affected spec: `openspec/specs/vite-web-foundation/spec.md`.
- Affected bead: supersedes/continues `sm-5j1g` (already `IN_PROGRESS`, originally scoped for
  classic Pages before this pivot).
- Manual, non-automatable follow-up: broadening the `CLOUDFLARE_API_TOKEN` permissions in the
  Cloudflare dashboard.

## Success Criteria

- `openspec/specs/vite-web-foundation/spec.md`'s "Static Build Output" requirement no longer
  names "Cloudflare Pages" specifically and accurately describes Workers static-asset hosting.
- A push to `main` triggers a GitHub Actions job that builds `apps/web` and deploys it via
  `wrangler deploy`, and that job completes successfully once the token permissions are
  broadened.
- `curl -sf https://storagemaxxing-web.mkobit-cloudflare.workers.dev` returns HTTP 200.
