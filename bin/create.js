#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const TEMPLATE_DIR = path.resolve(__dirname, '..', 'template');

function usage(code) {
  const stream = code === 0 ? process.stdout : process.stderr;
  stream.write('Usage: npx @hobobeach/express-base <project-directory>\n');
  process.exit(code);
}

function sanitizePackageName(raw) {
  const name = path.basename(raw).toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return /^[a-z0-9]/.test(name) ? name : `app-${name}`;
}

function main() {
  const arg = process.argv[2];
  if (!arg || arg === '-h' || arg === '--help') usage(arg ? 0 : 1);

  const dest = path.resolve(process.cwd(), arg);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    process.stderr.write(`Error: ${dest} exists and is not empty.\n`);
    process.exit(1);
  }
  fs.mkdirSync(dest, { recursive: true });

  fs.cpSync(TEMPLATE_DIR, dest, { recursive: true });

  for (const [from, to] of [['_gitignore', '.gitignore'], ['_npmrc', '.npmrc']]) {
    const src = path.join(dest, from);
    if (fs.existsSync(src)) fs.renameSync(src, path.join(dest, to));
  }

  const pkgPath = path.join(dest, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.name = sanitizePackageName(arg);
  pkg.version = '0.1.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  const secret = crypto.randomBytes(48).toString('base64url');
  fs.writeFileSync(path.join(dest, '.env.development'), `JWT_SECRET=${secret}\n`);

  const sqlite = path.join(dest, 'database.sqlite');
  if (fs.existsSync(sqlite)) fs.unlinkSync(sqlite);

  process.stdout.write(
    `\nCreated ${pkg.name} at ${dest}\n\n` +
      `Next steps:\n` +
      `  cd ${arg}\n` +
      `  npm install\n` +
      `  npm run dev\n\n`,
  );
}

main();
