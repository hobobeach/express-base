# @eaj/express-base
A TypeScript-based Express.js starter template providing a solid foundation for building secure, production-ready REST APIs and web applications. This boilerplate comes pre-configured with authentication via Passport and JWT, password hashing with bcrypt, TypeORM with SQLite for data persistence, file uploads through Multer, and server-side rendering via Handlebars. Security and reliability are reinforced with Helmet for hardened HTTP headers, express-rate-limit for request throttling, Zod for runtime input validation, and Pino for fast structured logging. It includes essential middleware for CORS, cookie parsing, and client IP detection, along with developer-friendly tooling like Nodemon for hot reloading, ts-node for executing TypeScript directly, and Rimraf for clean builds — letting you skip the repetitive setup and jump straight into building features.

## Install

```sh
npm install
```

The bundled `.npmrc` enables `legacy-peer-deps` to resolve a `peerOptional` mismatch between `typeorm@0.3.x` (which declares `sqlite3@^5`) and the patched `sqlite3@^6` used here.

## Run

```sh
npm run dev      # development with hot reload (nodemon)
npm run build    # compile TypeScript to ./dist
npm start        # build and run the compiled server
```
