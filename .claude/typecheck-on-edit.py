#!/usr/bin/env python3
import json, os, re, subprocess, sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")

if not re.search(r"\.(tsx?|mts|cts)$", path):
    sys.exit(0)

match = re.search(r"(?:^|/)(packages|apps)/([^/]+)/", path)
tsconfig = f"{match.group(1)}/{match.group(2)}/tsconfig.json" if match else "tsconfig.json"

if not os.path.isfile(tsconfig):
    sys.exit(0)

result = subprocess.run(
    ["node_modules/.bin/tsc", "--noEmit", "-p", tsconfig],
    capture_output=True,
    text=True,
)
if result.returncode != 0:
    sys.stderr.write(f"tsc --noEmit -p {tsconfig} failed:\n{result.stdout}{result.stderr}")
    sys.exit(2)
