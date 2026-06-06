const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = '/home/z/my-project';
const logFile = path.join(projectDir, 'dev.log');
const pidFile = path.join(projectDir, 'server.pid');

// Clean up previous instance
try {
  const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
  process.kill(oldPid, 0); // Check if alive
  console.log(`Killing old server PID ${oldPid}`);
  process.kill(oldPid, 'SIGTERM');
} catch (e) {
  // Old server not running, that's fine
}

// Remove .next cache
const { execSync } = require('child_process');
try { execSync('rm -rf ' + path.join(projectDir, '.next')); } catch(e) {}

// Start server
const logStream = fs.openSync(logFile, 'w');
const child = spawn('node', [
  path.join(projectDir, 'node_modules/.bin/next'),
  'dev', '-p', '3000', '-H', '0.0.0.0', '--webpack'
], {
  cwd: projectDir,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
  stdio: ['ignore', logStream, logStream],
  detached: true
});

child.unref();

// Save PID
fs.writeFileSync(pidFile, child.pid.toString());

console.log(`Server started with PID ${child.pid}`);
