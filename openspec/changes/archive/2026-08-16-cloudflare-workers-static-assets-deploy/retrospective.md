# Retrospective: cloudflare-workers-static-assets-deploy

## §0 Evidence

- **Commit Range**: CI workflow deploy step + wrangler config landed in PR #346 (prior session); this session closed out the remaining credential/auth blockers only (no code changes to the deploy job itself).
- **Tasks Completed**: 1.1 (CI deploy wiring, sm-5j1g), 2.1 (token permission broadening, sm-eujc) — both `[x]` in tasks.md.
- **Beads Closed**: sm-clni (Cloudflare account + secrets provisioning, prior session), sm-eujc (`Workers Scripts:Edit` permission), sm-9u95 (account-owned vs. user-scoped token), sm-5j1g (CI deploy wiring, unblocked by the above).
- **Test Status**: Verified via `gh run list --workflow=ci.yml` on `main` (run 31924624706, sha `1551ca7`) — `deploy` job `conclusion=success`. `curl -sf https://storagemaxxing-web.mkobit-cloudflare.workers.dev` returns HTTP 200.

## §1 Wins

- The blocker chain (sm-clni → sm-eujc/sm-9u95 → sm-5j1g) resolved cleanly once the human step happened — no code changes were needed once the workflow YAML already existed from PR #346, only a credential swap.
- Deploy succeeded on the very first CI-triggered push after the token swap — no auth retry/debug loop needed, confirming the diagnosis (permission scope + token ownership model) was correct on the first pass.
- Chose to verify against a real push to `main` (via an unrelated small bead's PR, sm-7mi5) rather than a manual `gh run rerun`, per sm-eujc's own note ("we shouldn't have to rerun any job basically ever") — this is a more honest verification of the actual trigger path.

## §2 Misses

- The account-owned-token requirement (sm-9u95) and the permission-scope requirement (sm-eujc) were filed as two separate beads discovered at different times, even though both were fixed in a single dashboard action (delete user-scoped token, create one account-owned token with the right permission). Worth flagging that human-blocked infra beads with the same root cause should be created together when the connection is knowable up front, to avoid a human doing the same navigation twice.
- No custom domain was ever tracked as a gap until this session — the deploy has been living at the default `*.workers.dev` URL since the original manual bootstrap deploy without anyone filing a bead for it. Filed as sm-reqc (P3) now.
- No PR preview deployments exist; every PR merges blind to a live preview, unlike the Pages product this replaced. Filed as sm-0hst (P3) now.

## §3 Surprises

- Cloudflare's account-owned tokens use a scannable `cfat_` prefix specifically to support leak-detection tooling (e.g. GitHub secret scanning) — a detail not otherwise documented in this repo before this session's research.
- `wrangler deploy` for Workers static assets needs no permission beyond `Workers Scripts:Edit` — static assets upload through the same script-upload endpoint, not a separate resource type. No KV/R2/Routes permissions were needed since `apps/web/wrangler.jsonc` has no such bindings.

## §4 Promote

- [ ] sm-reqc (custom domain) and sm-0hst (PR preview deployments) are both filed but unscoped — worth a short design pass before either is claimed, since PR previews in particular need a teardown story (per-PR-named workers accumulating otherwise).
