#!/usr/bin/env python3
import json, re, subprocess, sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")

if re.search(r'\.(tsx?|jsx?|mts|cts|jsonc?)$', path):
    result = subprocess.run(
        ["bunx", "eslint", "--fix", path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(f"eslint --fix {path} failed:\n{result.stdout}{result.stderr}")
        sys.exit(2)
