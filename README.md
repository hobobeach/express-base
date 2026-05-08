# @hobobeach/express-base


            ^^                   @@@@@@@@@
       ^^       ^^            @@@@@@@@@@@@@@@
                            @@@@@@@@@@@@@@@@@@              ^^
                           @@@@@@@@@@@@@@@@@@@@
 ~~~~ ~~ ~~~~~ ~~~~~~~~ ~~ &&&&&&&&&&&&&&&&&&&& ~~~~~~~ ~~~~~~~~~~~ ~~~
 ~         ~~   ~  ~       ~~~~~~~~~~~~~~~~~~~~ ~       ~~     ~~ ~
   ~      ~~      ~~ ~~ ~~  ~~~~~~~~~~~~~ ~~~~  ~     ~~~    ~ ~~~  ~ ~~
   ~  ~~     ~         ~      ~~~~~~  ~~ ~~~       ~~ ~ ~~  ~~ ~
 ~  ~       ~ ~      ~           ~~ ~~~~~~  ~      ~~  ~             ~~
       ~             ~        ~      ~      ~~   ~             ~
------------------------------------------------

A TypeScript-based Express.js starter template providing a solid foundation for building secure, production-ready REST APIs and web applications.

Pre-configured with Passport + JWT auth, bcrypt password hashing, TypeORM with SQLite, Multer file uploads, and Handlebars views. Hardened with Helmet, express-rate-limit, Zod validation, and structured logging. Developer tooling: Nodemon, ts-node, Rimraf.

## Scaffold a new project

```sh
npx @hobobeach/express-base my-app           # interactive plugin prompt
npx @hobobeach/express-base my-app --plugins=seo
npx @hobobeach/express-base my-app --no-plugins
cd my-app && npm install && npm run dev
```

The CLI copies the template, sets a fresh random `JWT_SECRET` in `.env.development`, renames the project's `package.json#name` to match your directory, and applies any selected plugins.

## Plugins

Opt-in features that emit real code into your project — once applied, the code is yours to edit.

```sh
npx @hobobeach/express-base list-plugins     # see what's available
npx @hobobeach/express-base add seo          # add a plugin to an already-scaffolded project (run from inside it)
```

Available plugins:

- **`seo`** — adds `GET /sitemap.xml`, `GET /robots.txt`, and a `seo-meta` Handlebars partial wired into `<head>`. Sets `SITE_URL` in `.env.development`.
- **`blog`** — adds a markdown-driven blog at `GET /blog`, `GET /blog/:slug`, `GET /blog/feed.xml` (RSS 2.0), and `GET /blog/sitemap.xml`. Posts are `.md` files with YAML frontmatter under `content/blog/`, rendered with `marked` + `gray-matter`. Sets `BLOG_TITLE` and `BLOG_DESCRIPTION` in `.env.development`.
- **`traffic`** — logs every non-static HTTP request to a `request_logs` TypeORM table (method, path, query, status, duration, IP, user-agent, referer, content-length) and auto-prunes old rows. Sets `TRAFFIC_LOG_ENABLED`, `TRAFFIC_LOG_RETENTION_DAYS`, and `TRAFFIC_LOG_SKIP_PATHS` in `.env.development`.

Plugins are tracked in `package.json` under `hobobeachExpressBase.plugins`, and their inserted code is wrapped in `// PLUGIN <name> BEGIN` / `END` markers so the CLI never double-applies.

## What you get

```
my-app/
├── .env.development      # JWT_SECRET pre-generated
├── .gitignore
├── .npmrc                # legacy-peer-deps=true (typeorm/sqlite3 peer fix)
├── nodemon.json
├── package.json
├── tsconfig.json
├── public/
├── src/
│   ├── app.ts
│   ├── app-data-source.ts
│   ├── server.ts
│   ├── middlewares/
│   ├── routes/
│   └── shared/
└── views/
```

See `CLAUDE.md` inside the scaffolded project for architecture notes.

## Caveats

- `.npmrc` ships `legacy-peer-deps=true` to resolve a peerOptional mismatch between `typeorm@0.3.x` (declares `sqlite3@^5`) and `sqlite3@^6`. Don't strip it.
- TypeORM is configured with `synchronize: true` — fine for dev, **disable before production**.
- `JWT_SECRET` is required; `src/shared/jwt.ts` throws at module load if it's unset.

## Developing this template

The shipped template lives in `template/`. To run it locally:

```sh
cd template
npm install
npm run dev
```

To publish a new version of the CLI:

```sh
npm publish --access public   # first publish only needs --access public
```
