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
npx @hobobeach/express-base my-app
cd my-app
npm install
npm run dev
```

The CLI copies the template, sets a fresh random `JWT_SECRET` in `.env.development`, and renames the project's `package.json#name` to match your directory.

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
