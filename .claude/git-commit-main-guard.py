#!/usr/bin/env python3
# Sanity check: mise x -- uvx ty check .claude/git-commit-main-guard.py
# and: mise x -- uvx ruff check .claude/git-commit-main-guard.py
import json
import os
import re
import subprocess
import sys

PROTECTED_BRANCH = "main"

data = json.load(sys.stdin)
command = data.get("tool_input", {}).get("command", "")

if not re.search(r"\bgit\s+commit\b", command):
    sys.exit(0)

project_root = os.environ.get("CLAUDE_PROJECT_DIR", ".")
result = subprocess.run(
    ["git", "rev-parse", "--abbrev-ref", "HEAD"],
    cwd=project_root,
    capture_output=True,
    text=True,
    check=False,
)
if result.returncode != 0:
    sys.exit(0)

branch = result.stdout.strip()
if branch != PROTECTED_BRANCH:
    sys.exit(0)

sys.stderr.write(
    f"Refusing to run 'git commit' on local '{PROTECTED_BRANCH}' -- it is "
    "branch-protected (GH013) and every commit must land on a topic branch. "
    f"Run 'git checkout -b <topic-branch>' first, then retry the commit.\n",
)
sys.exit(2)
