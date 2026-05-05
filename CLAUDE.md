# CLAUDE.md

Guidance for working on **this repo** (the `@hobobeach/express-base` CLI + template package). For guidance on the *scaffolded* app, see `template/CLAUDE.md`.

## Layout

```
.
├── bin/create.js       # CLI entry; published as the `express-base` bin
├── template/           # everything copied into a scaffolded project
│   ├── _gitignore      # renamed to .gitignore by the CLI (npm strips a literal .gitignore at the package root, but inside template/ this rename is just defensive)
│   ├── _npmrc          # renamed to .npmrc by the CLI — npm always strips literal .npmrc files from published packages
│   ├── CLAUDE.md       # guidance for the scaffolded project
│   ├── package.json    # the project's package.json (CLI rewrites `name`)
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

## CLI invariants

- `bin/create.js` is CommonJS by intent; the root package has no `"type": "module"` so `npx` runs it without a build step. Don't convert it to ESM unless you also wire up a build.
- The CLI uses `fs.cpSync` (Node 16.7+); `engines.node` is set to `>=18`.
- The CLI rewrites `package.json#name` and generates a fresh `JWT_SECRET` — keep that behavior. Do **not** ship a static `.env.development` (it's excluded from `files`).
