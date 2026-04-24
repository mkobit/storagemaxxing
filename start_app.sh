#!/bin/bash
cd apps/web
bun serve.ts > server.log 2>&1 &
echo $! > server.pid
sleep 2
