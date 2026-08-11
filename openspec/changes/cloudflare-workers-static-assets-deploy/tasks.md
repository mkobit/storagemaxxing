<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. CI deploy wiring

- [ ] 1.1 [sm-5j1g](../../../.beads) Wire GitHub Actions step: build `apps/web`, deploy via `bunx wrangler deploy` on push to `main` only
  - Validation: `gh run list --workflow=ci.yml` shows the deploy job with `conclusion=success`, and `curl -sf https://storagemaxxing-web.mkobit-cloudflare.workers.dev` returns HTTP 200

## 2. Manual follow-up (human, non-automatable)

- [ ] 2.1 [sm-eujc](../../../.beads) Broaden `CLOUDFLARE_API_TOKEN` permissions to include `Workers Scripts:Edit` (or issue a replacement token)
  - Validation: the next CI-triggered deploy job (sm-5j1g) authenticates successfully instead of failing with a Cloudflare permission error
