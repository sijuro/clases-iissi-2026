#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { writeFileSync, appendFileSync } = require('fs');
const path = require('path');

const root = process.cwd();
const logPath = path.join(root, 'restore-npm-cache-all.log');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const commands = [
  {
    cwd: root,
    command: npmCommand,
    args: ['run', 'restore:npm-cache'],
  },
  {
    cwd: path.join(root, 'DeliverUS-Backend'),
    command: npmCommand,
    args: ['ci', '--offline', '--cache', '../.npm-cache-deliverus', '--prefer-offline', '--no-audit', '--no-fund'],
  },
  {
    cwd: path.join(root, 'DeliverUS-Frontend-Owner'),
    command: npmCommand,
    args: ['ci', '--offline', '--cache', '../.npm-cache-deliverus', '--prefer-offline', '--no-audit', '--no-fund'],
  },
  {
    cwd: path.join(root, 'DeliverUS-Frontend-Rider'),
    command: npmCommand,
    args: ['ci', '--offline', '--cache', '../.npm-cache-deliverus', '--prefer-offline', '--no-audit', '--no-fund'],
  },
];

function log(message) {
  const line = `${new Date().toISOString()} ${message}`;
  process.stdout.write(`${line}\n`);
  appendFileSync(logPath, `${line}\n`);
}

writeFileSync(logPath, `Restore npm cache all log started at ${new Date().toISOString()}\n`);

for (const { cwd, command, args } of commands) {
  log(`\n--- Running: ${command} ${args.join(' ')} (cwd=${cwd}) ---`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.stdout) {
    log(`stdout:\n${result.stdout.trim()}`);
  }
  if (result.stderr) {
    log(`stderr:\n${result.stderr.trim()}`);
  }

  if (result.status !== 0) {
    log(`ERROR: command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

log('Restore npm cache all completed successfully.');
