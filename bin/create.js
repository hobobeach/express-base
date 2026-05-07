#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'template');
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const TEMPLATE_VERSION = require(path.join(ROOT, 'package.json')).version;

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args[0] === 'add') return { kind: 'add', plugin: args[1] };
  if (args[0] === 'list-plugins') return { kind: 'list' };
  if (args.length === 0) return { kind: 'help', exitCode: 1 };
  if (args[0] === '-h' || args[0] === '--help') return { kind: 'help', exitCode: 0 };

  const flags = { plugins: null, noPlugins: false };
  const positional = [];
  for (const a of args) {
    if (a === '--no-plugins') flags.noPlugins = true;
    else if (a.startsWith('--plugins=')) {
      flags.plugins = a.slice('--plugins='.length).split(',').map(s => s.trim()).filter(Boolean);
    } else if (a.startsWith('-')) {
      process.stderr.write(`Unknown flag: ${a}\n`);
      process.exit(1);
    } else {
      positional.push(a);
    }
  }
  if (positional.length !== 1) return { kind: 'help', exitCode: 1 };
  return { kind: 'scaffold', target: positional[0], ...flags };
}

function listAvailablePlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) return [];
  return fs.readdirSync(PLUGINS_DIR)
    .filter(n => fs.existsSync(path.join(PLUGINS_DIR, n, 'plugin.json')))
    .map(n => loadPlugin(n));
}

function loadPlugin(name) {
  const dir = path.join(PLUGINS_DIR, name);
  const manifestPath = path.join(dir, 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Plugin "${name}" not found at ${dir}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return { ...manifest, dir };
}

function sanitizePackageName(raw) {
  const name = path.basename(raw).toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return /^[a-z0-9]/.test(name) ? name : `app-${name}`;
}

function readPkg(projectDir) {
  return JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
}

function writePkg(projectDir, pkg) {
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n',
  );
}

function preflightPatches(plugin, projectDir) {
  for (const patch of plugin.patches || []) {
    const filePath = path.join(projectDir, patch.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Plugin "${plugin.name}": patch target ${patch.file} not found.`);
    }
    const body = fs.readFileSync(filePath, 'utf8');
    if (!body.includes(patch.anchor)) {
      throw new Error(`Plugin "${plugin.name}": anchor "${patch.anchor}" not found in ${patch.file}.`);
    }
  }
}

function applyPatch(pluginName, patch, projectDir) {
  const filePath = path.join(projectDir, patch.file);
  const original = fs.readFileSync(filePath, 'utf8');
  const isHbs = patch.file.endsWith('.hbs') || patch.file.endsWith('.html');
  const beginMarker = isHbs ? `<!-- PLUGIN ${pluginName} BEGIN -->` : `// PLUGIN ${pluginName} BEGIN`;
  const endMarker = isHbs ? `<!-- PLUGIN ${pluginName} END -->` : `// PLUGIN ${pluginName} END`;

  const lines = original.split('\n');
  const anchorIdx = lines.findIndex(l => l.includes(patch.anchor));
  const indent = lines[anchorIdx].match(/^[ \t]*/)[0];
  const block = [
    `${indent}${beginMarker}`,
    ...patch.snippet.split('\n').map(l => `${indent}${l}`),
    `${indent}${endMarker}`,
  ];
  lines.splice(anchorIdx, 0, ...block);
  fs.writeFileSync(filePath, lines.join('\n'));
}

function copyPluginFiles(plugin, projectDir) {
  for (const f of plugin.files || []) {
    const src = path.join(plugin.dir, f.from);
    const dst = path.join(projectDir, f.to);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
  }
}

function mergeDeps(pkg, plugin) {
  for (const [k, v] of Object.entries(plugin.dependencies || {})) {
    pkg.dependencies = pkg.dependencies || {};
    if (!pkg.dependencies[k]) pkg.dependencies[k] = v;
  }
  for (const [k, v] of Object.entries(plugin.devDependencies || {})) {
    pkg.devDependencies = pkg.devDependencies || {};
    if (!pkg.devDependencies[k]) pkg.devDependencies[k] = v;
  }
}

function appendEnvVars(plugin, projectDir) {
  if (!plugin.envVars || !Object.keys(plugin.envVars).length) return;
  const envPath = path.join(projectDir, '.env.development');
  let body = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (body && !body.endsWith('\n')) body += '\n';
  let appended = '';
  for (const [k, v] of Object.entries(plugin.envVars)) {
    if (new RegExp(`^${k}=`, 'm').test(body)) continue;
    appended += `${k}=${v}\n`;
  }
  if (appended) fs.writeFileSync(envPath, `${body}\n# ${plugin.name} plugin\n${appended}`);
}

function applyPlugin(plugin, projectDir) {
  const pkg = readPkg(projectDir);
  const installed = (pkg.hobobeachExpressBase && pkg.hobobeachExpressBase.plugins) || [];
  if (installed.includes(plugin.name)) {
    process.stderr.write(`Plugin "${plugin.name}" is already installed; skipping.\n`);
    return false;
  }

  preflightPatches(plugin, projectDir);
  copyPluginFiles(plugin, projectDir);
  for (const patch of plugin.patches || []) applyPatch(plugin.name, patch, projectDir);

  mergeDeps(pkg, plugin);
  pkg.hobobeachExpressBase = pkg.hobobeachExpressBase || { templateVersion: TEMPLATE_VERSION, plugins: [] };
  pkg.hobobeachExpressBase.plugins = [...installed, plugin.name];
  writePkg(projectDir, pkg);

  appendEnvVars(plugin, projectDir);
  return true;
}

async function promptForPlugins(plugins) {
  if (!plugins.length) return [];
  process.stdout.write('\nAvailable plugins:\n');
  plugins.forEach((p, i) => process.stdout.write(`  ${i + 1}) ${p.name} — ${p.description}\n`));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve =>
    rl.question('\nSelect plugins (comma-separated numbers, or press enter for none): ', resolve),
  );
  rl.close();
  if (!answer.trim()) return [];
  const selected = [];
  for (const part of answer.split(',')) {
    const i = parseInt(part.trim(), 10) - 1;
    if (i >= 0 && i < plugins.length) selected.push(plugins[i]);
  }
  return selected;
}

async function scaffold({ target, plugins, noPlugins }) {
  const dest = path.resolve(process.cwd(), target);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    process.stderr.write(`Error: ${dest} exists and is not empty.\n`);
    process.exit(1);
  }

  const available = listAvailablePlugins();
  let toApply = [];
  if (plugins) {
    for (const name of plugins) {
      const found = available.find(p => p.name === name);
      if (!found) {
        process.stderr.write(`Unknown plugin: ${name}\n`);
        process.exit(1);
      }
      toApply.push(found);
    }
  } else if (!noPlugins && process.stdin.isTTY) {
    toApply = await promptForPlugins(available);
  }

  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(TEMPLATE_DIR, dest, { recursive: true });

  for (const [from, to] of [['_gitignore', '.gitignore'], ['_npmrc', '.npmrc']]) {
    const src = path.join(dest, from);
    if (fs.existsSync(src)) fs.renameSync(src, path.join(dest, to));
  }

  const pkg = readPkg(dest);
  pkg.name = sanitizePackageName(target);
  pkg.version = '0.1.0';
  pkg.hobobeachExpressBase = { templateVersion: TEMPLATE_VERSION, plugins: [] };
  writePkg(dest, pkg);

  const secret = crypto.randomBytes(48).toString('base64url');
  fs.writeFileSync(path.join(dest, '.env.development'), `JWT_SECRET=${secret}\n`);

  const sqlite = path.join(dest, 'database.sqlite');
  if (fs.existsSync(sqlite)) fs.unlinkSync(sqlite);

  for (const plugin of toApply) {
    process.stdout.write(`Applying plugin: ${plugin.name}\n`);
    applyPlugin(plugin, dest);
  }

  process.stdout.write(`\nCreated ${pkg.name} at ${dest}\n`);
  if (toApply.length) process.stdout.write(`Plugins: ${toApply.map(p => p.name).join(', ')}\n`);
  process.stdout.write('\nNext steps:\n');
  process.stdout.write(`  cd ${target}\n`);
  process.stdout.write('  npm install\n');
  process.stdout.write('  npm run dev\n\n');
}

function add({ plugin: pluginName }) {
  if (!pluginName) {
    process.stderr.write('Usage: npx @hobobeach/express-base add <plugin>\n');
    process.exit(1);
  }
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    process.stderr.write('Error: no package.json in current directory.\n');
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.hobobeachExpressBase) {
    process.stderr.write('Error: this directory is not an @hobobeach/express-base project ' +
      '(no `hobobeachExpressBase` marker in package.json).\n');
    process.exit(1);
  }
  const plugin = loadPlugin(pluginName);
  if (applyPlugin(plugin, cwd)) {
    process.stdout.write(`\nApplied plugin: ${plugin.name}\n`);
    process.stdout.write('Run `npm install` to pick up any new dependencies.\n');
  }
}

function listPlugins() {
  const plugins = listAvailablePlugins();
  if (!plugins.length) {
    process.stdout.write('No plugins available.\n');
    return;
  }
  process.stdout.write('Available plugins:\n');
  for (const p of plugins) process.stdout.write(`  ${p.name} — ${p.description}\n`);
}

function help(exitCode) {
  const out = exitCode === 0 ? process.stdout : process.stderr;
  out.write(
    'Usage:\n' +
    '  npx @hobobeach/express-base <project>                  Scaffold (interactive plugin prompt)\n' +
    '  npx @hobobeach/express-base <project> --plugins=a,b    Scaffold with specific plugins\n' +
    '  npx @hobobeach/express-base <project> --no-plugins     Scaffold with no plugins\n' +
    '  npx @hobobeach/express-base add <plugin>               Add a plugin to an existing project\n' +
    '  npx @hobobeach/express-base list-plugins               Show available plugins\n',
  );
  process.exit(exitCode);
}

async function main() {
  const cmd = parseArgs(process.argv);
  if (cmd.kind === 'help') help(cmd.exitCode);
  else if (cmd.kind === 'list') listPlugins();
  else if (cmd.kind === 'add') add(cmd);
  else if (cmd.kind === 'scaffold') await scaffold(cmd);
}

main().catch(err => {
  process.stderr.write((err.stack || err.message || String(err)) + '\n');
  process.exit(1);
});
