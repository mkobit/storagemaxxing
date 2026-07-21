#!/usr/bin/env python3
# Sanity check: mise x -- uvx ty check .claude/openspec-canonical-guard-on-edit.py
# and: mise x -- uvx ruff check .claude/openspec-canonical-guard-on-edit.py
import json
import os
import re
import sys
from pathlib import Path

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")
project_root = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))

match = re.search(r"(?:^|/)openspec/specs/([^/]+)/spec\.md$", path)
if not match:
    sys.exit(0)

capability = match.group(1)
changes_dir = project_root / "openspec" / "changes"
if not changes_dir.is_dir():
    sys.exit(0)

conflicting_changes = sorted(
    change_dir.name
    for change_dir in changes_dir.iterdir()
    if change_dir.is_dir()
    and change_dir.name != "archive"
    and (change_dir / "specs" / capability / "spec.md").is_file()
)

if conflicting_changes:
    names = ", ".join(conflicting_changes)
    sys.stderr.write(
        f"openspec/specs/{capability}/spec.md was edited directly, but active "
        f"change(s) {names} already carry a specs/{capability}/spec.md delta. "
        "Canonical specs are derived from that delta via `bunx openspec archive` -- "
        "edit the delta under openspec/changes/<name>/specs/ instead, or CI will "
        "reject a PR that touches both.\n",
    )
    sys.exit(2)
