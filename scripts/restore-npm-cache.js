#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const TARFILE = 'deliverus-npm-cache.tar.gz';
const ZIPFILE = 'deliverus-npm-cache.zip';
const CACHE_DIR = '.npm-cache-deliverus';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(cmd, args, opts = {}) {
  console.log('> ' + cmd + ' ' + (args || []).join(' '));
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error) console.error('spawn error:', r.error);
  return r.status === 0;
}

function tryTarExtract() {
  if (!existsSync(TARFILE)) return false;
  return run('tar', ['-xzf', TARFILE]);
}

function try7zExtract() {
  if (!existsSync(TARFILE)) return false;
  // 7z can extract gz and tar layers
  return run('7z', ['x', TARFILE]) && run('7z', ['x', TARFILE.replace(/\.gz$/, '')]);
}

function tryZipExtract() {
  if (!existsSync(ZIPFILE)) return false;
  return run('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path \"${path.resolve(ZIPFILE)}\" -DestinationPath \"${path.resolve('.')}\" -Force`]);
}

function npmCiWithCache() {
  console.log('Running npm ci using local cache...');
  return run(npmCommand, ['ci', '--offline', '--cache', CACHE_DIR, '--prefer-offline', '--no-audit', '--no-fund']);
}

function main() {
  if (!existsSync(TARFILE) && !existsSync(ZIPFILE)) {
    console.error('No archive found. Please copy deliverus-npm-cache.tar.gz or deliverus-npm-cache.zip into the project root.');
    process.exit(1);
  }

  let extracted = false;
  if (existsSync(TARFILE)) {
    console.log('Trying tar extraction...');
    extracted = tryTarExtract();
    if (!extracted) {
      console.warn('tar extraction failed; trying 7z...');
      extracted = try7zExtract();
    }
  }

  if (!extracted && existsSync(ZIPFILE)) {
    console.log('Trying zip extraction...');
    extracted = tryZipExtract();
  }

  if (!extracted) {
    console.error('Extraction failed. On Windows ensure tar.exe or 7z is available, or extract manually with 7-Zip/WSL.');
    process.exit(1);
  }

  // Now run npm ci using the cache
  if (!npmCiWithCache()) {
    process.exit(1);
  }

  console.log('Installation complete.');
}

main();
