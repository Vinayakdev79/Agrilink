#!/bin/bash
cd /home/z/my-project
while true; do
  rm -rf .next
  NODE_OPTIONS="--max-old-space-size=8192" node_modules/.bin/next dev -p 3000 -H 0.0.0.0 --webpack >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] Server exited, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
