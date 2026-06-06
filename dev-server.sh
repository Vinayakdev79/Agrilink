#!/bin/bash
cd /home/z/my-project
while true; do
  rm -rf .next
  NODE_OPTIONS="--max-old-space-size=8192" node_modules/.bin/next dev -p 3000 -H 0.0.0.0 --webpack 2>&1 | tee /home/z/my-project/dev.log
  echo "Server crashed at $(date), restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
