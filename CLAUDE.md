# CLAUDE.md

Guidance for working on **this repo** (the `@hobobeach/express-base` CLI + template package). For guidance on the *scaffolded* app, see `template/CLAUDE.md`.

## Layout

```
.
├── bin/create.js       # CLI entry; published as the `express-base` bin
├── plugins/            # scaffold-time plugins (see "Plugins" below)
│   └── seo/
│       ├── plugin.json
│       └── files/      # tree mirroring the project root, copied into scaffolded apps
├── template/           # everything copied into a scaffolded project
│   ├── _gitignore      # renamed to .gitignore by the CLI (npm strips a literal .gitignore at the package root, but inside template/ this rename is just defensive)
│   ├── _npmrc          # renamed to .npmrc by the CLI — npm always strips literal .npmrc files from published packages
│   ├── CLAUDE.md       # guidance for the scaffolded project
│   ├── package.json    # the project's package.json (CLI rewrites `name`, adds `hobobeachExpressBase` marker)
│   ├── nodemon.json
│   ├── tsconfig.json
│   ├── public/ src/ views/
│   └── .env.development, database.sqlite  # local dev only; not shipped (see `files` allowlist in root package.json)
├── .npmrc              # repo-root copy of legacy-peer-deps=true so `cd template && npm install` still works during template dev (NOT shipped)
├── package.json        # the CLI package — no Express deps, only `bin` and `files`
└── README.md           # npm landing page
```

## Commands

```sh
# Develop the template (runs the actual Express app):
cd template && npm install && npm run dev

# Test the CLI without publishing:
node bin/create.js /tmp/scratch-app
```

## Publishing

`files` in root `package.json` is an explicit allowlist — when adding new top-level files/dirs to `template/`, **add them to `files`** or they won't ship.

```sh
npm publish --dry-run        # inspect the tarball
npm publish --access public  # first publish; scoped packages default to private
```

The CLI itself has zero runtime deps (Node stdlib only) so `npx` stays fast. Don't add deps to root `package.json` — put them in `template/package.json` if they belong to the scaffolded app.

## Plugins

Plugins are scaffold-time generators. Each lives in `plugins/<name>/` with a `plugin.json` manifest and a `files/` tree whose paths mirror the project root. The CLI:

1. Copies `files/*` into the scaffolded project.
2. Applies `patches[]` — each patch finds an anchor comment in a template file and inserts a snippet wrapped in `// PLUGIN <name> BEGIN` / `END` markers above it.
3. Merges `dependencies` / `devDependencies` into the project's `package.json` (existing versions win — never override the user).
4. Appends `envVars` to `.env.development` under a `# <name> plugin` heading, skipping any key already present.
5. Records the plugin name in `package.json#hobobeachExpressBase.plugins` so re-installation is a safe no-op.

### Anchor inventory

Template files carry these anchor comments. Don't remove them; new plugins should target one of these (or you'll need to add a new anchor):

| File | Anchor |
|---|---|
| `template/src/app.ts` | `// PLUGINS: import` |
| `template/src/app.ts` | `// PLUGINS: view-helpers` |
| `template/src/app.ts` | `// PLUGINS: middleware` |
| `template/src/app.ts` | `// PLUGINS: routes` |
| `template/src/app-data-source.ts` | `// PLUGINS: data-source-import` |
| `template/src/app-data-source.ts` | `// PLUGINS: entities` |
| `template/src/server.ts` | `// PLUGINS: init` |
| `template/views/layouts/default.hbs` | `<!-- PLUGINS: head -->` |

Patches insert *before* the anchor line. Indentation is inherited from the anchor's own indent.

### Authoring a plugin

1. Create `plugins/<name>/plugin.json` — schema mirrors the existing `seo` plugin.
2. Drop files into `plugins/<name>/files/` using paths relative to the project root.
3. Each patch needs `file`, `anchor`, `position: "before"`, `snippet`. Multi-line snippets work (use `\n`).
4. Test: `node bin/create.js /tmp/scratch --plugins=<name>` then `cd /tmp/scratch && npm install && npx tsc --noEmit`.
5. The CLI pre-flights all patches before any side effects, so a missing anchor fails fast with no half-applied state.

## CLI invariants

- `bin/create.js` is CommonJS by intent; the root package has no `"type": "module"` so `npx` runs it without a build step. Don't convert it to ESM unless you also wire up a build.
- The CLI uses `fs.cpSync` (Node 16.7+); `engines.node` is set to `>=18`.
- The CLI rewrites `package.json#name` and generates a fresh `JWT_SECRET` — keep that behavior. Do **not** ship a static `.env.development` (it's excluded from `files`).
