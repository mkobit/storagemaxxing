#!/usr/bin/env python3
import json, re, subprocess, sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")

match = re.search(r"openspec/changes/([^/]+)/", path)
if not match or match.group(1) == "archive":
    sys.exit(0)

change_name = match.group(1)
result = subprocess.run(
    ["bunx", "openspec", "validate", change_name, "--strict"],
    capture_output=True,
    text=True,
)

if result.returncode != 0:
    sys.stderr.write(f"openspec validate {change_name} --strict failed:\n{result.stdout}{result.stderr}")
    sys.exit(2)
