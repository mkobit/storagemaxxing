#!/usr/bin/env python3
import json, re, subprocess, sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")

if re.search(r'\.(tsx?|jsx?|mts|cts|jsonc?)$', path):
    subprocess.run(["bunx", "eslint", "--fix", path])
