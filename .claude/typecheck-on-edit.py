#!/usr/bin/env python3
# Sanity check: mise x -- uvx ty check .claude/typecheck-on-edit.py
# and: mise x -- uvx ruff check .claude/typecheck-on-edit.py
import json
import os
import re
import subprocess
import sys
from pathlib import Path

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")
project_root = os.environ.get("CLAUDE_PROJECT_DIR", ".")

if not re.search(r"\.(tsx?|mts|cts)$", path):
    sys.exit(0)

match = re.search(r"(?:^|/)(packages|apps)/([^/]+)/", path)
tsconfig = (
    f"{match.group(1)}/{match.group(2)}/tsconfig.json" if match else "tsconfig.json"
)

if not Path(project_root, tsconfig).is_file():
    sys.exit(0)

result = subprocess.run(
    ["bunx", "tsc", "--noEmit", "-p", tsconfig],
    cwd=project_root,
    capture_output=True,
    text=True,
    check=False,
)
if result.returncode != 0:
    sys.stderr.write(
        f"tsc --noEmit -p {tsconfig} failed:\n{result.stdout}{result.stderr}",
    )
    sys.exit(2)
