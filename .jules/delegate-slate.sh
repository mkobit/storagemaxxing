#!/usr/bin/env bash
# delegate-slate.sh — measure parallel dispatch width for delegate-ready beads
#
# Concurrency width (CW): the maximum number of delegate-ready beads that can
# be claimed in parallel right now without violating the scope-collision rule
# in .jules/prompts/delegation-contract.md.
#
# Usage:
#   .jules/delegate-slate.sh           # human-readable
#   .jules/delegate-slate.sh --json    # JSON for orchestrators

set -euo pipefail

label="${DELEGATE_LABEL:-delegate:any-low}"
format="human"
if [[ "${1:-}" == "--json" ]]; then
  format="json"
fi

raw=$(bd query "label=${label}" --json 2>/dev/null)
if [[ -z "$raw" || "$raw" == "null" ]]; then
  raw="[]"
fi

# Bucket beads by their scope: label. For each scope:
#   - if any bead is in_progress -> scope is "blocked" (a runner already owns it)
#   - else                       -> scope is "dispatchable", pick the highest-priority open bead
slate=$(jq -c '
  def scope_of: (.labels[] | select(startswith("scope:"))) // "scope:unknown";
  group_by(scope_of) as $by_scope
  | $by_scope
  | map({
      scope:        (.[0] | scope_of),
      in_progress:  map(select(.status == "in_progress")),
      open:         map(select(.status == "open"))
    })
  | map(. + {
      dispatchable: ((.in_progress | length) == 0 and (.open | length) > 0),
      pick:         (.open | sort_by(.priority) | .[0])
    })
' <<<"$raw")

cw=$(jq '[.[] | select(.dispatchable)] | length' <<<"$slate")
blocked=$(jq -c '[.[] | select(.dispatchable | not) | .scope]' <<<"$slate")
picks=$(jq -c '[.[] | select(.dispatchable) | .pick | {id, scope: (.labels[] | select(startswith("scope:"))), priority, title}] | sort_by(.priority)' <<<"$slate")
total_open=$(jq '[.[] | .open | length] | add // 0' <<<"$slate")
total_inflight=$(jq '[.[] | .in_progress | length] | add // 0' <<<"$slate")

if [[ "$format" == "json" ]]; then
  jq -n \
    --argjson cw "$cw" \
    --argjson blocked "$blocked" \
    --argjson slate "$picks" \
    --argjson total_open "$total_open" \
    --argjson total_inflight "$total_inflight" \
    --arg label "$label" \
    '{label: $label, concurrency_width: $cw, blocked_scopes: $blocked, slate: $slate, total_open: $total_open, total_inflight: $total_inflight}'
  exit 0
fi

printf 'Delegate-ready slate (label=%s)\n' "$label"
printf '  concurrency width:    %s\n' "$cw"
printf '  total open candidates: %s\n' "$total_open"
printf '  in-flight scopes:     %s\n' "$(jq -r '. | join(", ") | if . == "" then "(none)" else . end' <<<"$blocked")"
echo
echo 'Dispatch slate (one bead per dispatchable scope, highest priority first):'
jq -r '.[] | "  \(.id)  P\(.priority)  \(.scope)  \(.title)"' <<<"$picks"
