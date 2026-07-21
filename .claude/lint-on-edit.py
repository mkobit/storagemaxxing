#!/usr/bin/env python3
# Sanity check: mise x -- uvx ty check .claude/lint-on-edit.py
# and: mise x -- uvx ruff check .claude/lint-on-edit.py
import json
import os
import re
import subprocess
import sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")
project_root = os.environ.get("CLAUDE_PROJECT_DIR", ".")

if re.search(r"\.(tsx?|jsx?|mts|cts|jsonc?)$", path):
    result = subprocess.run(
        ["bunx", "eslint", "--fix", path],
        cwd=project_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        sys.stderr.write(f"eslint --fix {path} failed:\n{result.stdout}{result.stderr}")
        sys.exit(2)
