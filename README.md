# Task Management API

A production-style REST API for registering users, authenticating with JWTs, and managing user-owned tasks. It includes role-protected administration routes, strict request validation, consistent error responses, pagination/filtering/search, Swagger documentation, automated tests, and a Docker Compose setup with MongoDB.

## Technology

- Node.js 20.11+ and TypeScript
- NestJS 11
- MongoDB 8 and Mongoose
- Passport JWT and bcrypt
- class-validator and Joi
- Swagger / OpenAPI
- Jest, Supertest, and mongodb-memory-server
- Docker and Docker Compose

## Prerequisites

For local development:

- Node.js 20.11 or newer
- npm 10 or newer
- MongoDB available locally or through a hosted MongoDB connection string

For the container workflow, only Docker with the Compose plugin is required.

## Environment configuration

Copy the safe example and replace the placeholder JWT secret:

```bash
cp .env.example .env
```

| Variable         | Required | Description                                                                                                   |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `PORT`           | No       | HTTP port; defaults to `3000`.                                                                                |
| `MONGODB_URI`    | Yes      | MongoDB or MongoDB Atlas connection string. Compose overrides this to use its `mongodb` service.              |
| `JWT_SECRET`     | Yes      | Private signing secret containing at least 32 characters. Use a randomly generated value outside development. |
| `JWT_EXPIRES_IN` | Yes      | Token lifetime as an integer followed by `s`, `m`, `h`, or `d`, such as `1d`.                                 |

Do not commit `.env`. The repository ignores local environment files and tracks only `.env.example`.

## Install and run locally

Start MongoDB first and make sure `MONGODB_URI` in `.env` can reach it. Then:

```bash
npm ci
npm run start:dev
```

The API starts at `http://localhost:3000` by default. Useful commands:

```bash
npm run build        # compile the production bundle
npm run start:prod   # run an existing production bundle
npm run format       # format source and tests
npm run format:check # verify formatting without changing files
npm run lint         # run ESLint
```

## Run with Docker Compose

After creating `.env` and setting a 32-character-or-longer `JWT_SECRET`, run:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

Compose starts MongoDB first, waits for its health check, then starts the API. Application data is kept in the named `mongodb-data` volume. Stop the services without deleting data using:

```bash
docker compose down
```

To delete the development database volume as well, explicitly run `docker compose down --volumes`.

## API documentation

With the API running:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`
- Health endpoint: `GET http://localhost:3000/`

Use Swagger's **Authorize** button with the access token returned by registration or login. Enter the token itself; Swagger adds the `Bearer` prefix.

## Endpoint summary

| Method   | Path               | Access        | Purpose                                       |
| -------- | ------------------ | ------------- | --------------------------------------------- |
| `GET`    | `/`                | Public        | Process health check                          |
| `POST`   | `/auth/register`   | Public        | Register a normal user and return a JWT       |
| `POST`   | `/auth/login`      | Public        | Authenticate and return a JWT                 |
| `GET`    | `/auth/me`         | Authenticated | Return the current user without password data |
| `POST`   | `/tasks`           | Authenticated | Create a task owned by the current user       |
| `GET`    | `/tasks`           | Authenticated | List only the current user's tasks            |
| `GET`    | `/tasks/:id`       | Owner         | Retrieve an owned task                        |
| `PATCH`  | `/tasks/:id`       | Owner         | Update an owned task                          |
| `DELETE` | `/tasks/:id`       | Owner         | Delete an owned task                          |
| `GET`    | `/users`           | Admin         | List users without password data              |
| `GET`    | `/users/:id`       | Admin         | Retrieve a user without password data         |
| `DELETE` | `/users/:id`       | Admin         | Delete a user and that user's tasks           |
| `GET`    | `/admin/tasks`     | Admin         | List tasks across all owners                  |
| `DELETE` | `/admin/tasks/:id` | Admin         | Delete any task                               |

Successful delete operations return `204 No Content`. Validation and application errors use a consistent envelope containing `statusCode`, `error`, `message`, `path`, and `timestamp`.

## Authentication flow

1. Register with `name`, `email`, and `password`, or log in with `email` and `password`.
2. Read `accessToken` from the response.
3. Send it on protected requests as `Authorization: Bearer <accessToken>`.
4. Use `GET /auth/me` to retrieve the user represented by the token.

Passwords must contain 8-72 UTF-8 bytes. They are hashed with bcrypt before storage, excluded from normal database queries and serialization, and never returned by the API. JWTs contain only the user ID and role. Authentication resolves the user from the database on every request, so deleted users lose access immediately and role changes take effect on the next request.

## Authorization and ownership

- Public registration always creates a `user`; clients cannot self-assign `admin`.
- All task routes require a valid JWT.
- User task reads, updates, deletes, filters, searches, counts, and pagination are owner-scoped in MongoDB queries.
- A missing task and another user's task both return `404`, preventing task-ID probing.
- Admin routes require JWT authentication followed by role authorization. Anonymous access returns `401`; an authenticated normal user receives `403`.
- Admins can inspect users and all tasks, delete any task, and delete a user together with that user's tasks.

## Create an admin

There is intentionally no public role-management endpoint. First register the account normally, then promote it through the trusted local command:

```bash
npm run admin:promote -- admin@example.com
```

The command uses the same `.env` configuration as the API. For the Compose stack, run the compiled script inside the API container:

```bash
docker compose exec api node dist/scripts/promote-admin.js admin@example.com
```

Log in again after promotion to receive a fresh token. Authorization also checks the current database role on every authenticated request.

## Pagination, filtering, and search

User and admin task lists return this envelope:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 0,
  "totalPages": 0
}
```

`page` defaults to `1`; `limit` defaults to `10` and cannot exceed `100`. Supported examples:

```text
GET /tasks?page=2&limit=20
GET /tasks?status=completed
GET /tasks?priority=high
GET /tasks?search=nestjs
GET /tasks?status=pending&priority=high&search=api
GET /admin/tasks?page=1&limit=10&status=completed
```

Search is case- and diacritic-insensitive and token-based across task titles and descriptions. Filters, search, and pagination can be combined. Results are newest first with deterministic tie-breaking.

## Tests and quality checks

The end-to-end suite uses a disposable MongoDB instance and does not require the development database. If a local `mongod` binary exists, the suite reuses it; otherwise mongodb-memory-server downloads a compatible binary on first use.

```bash
npm run format:check
npm run lint
npm run test:all
npm run test:cov
npm run build
```

`npm run test:all` runs unit and end-to-end tests. Coverage output is written under `coverage/` and `test/coverage/`.

## Design decisions

- Controllers only translate HTTP input/output; authentication, ownership, user deletion cleanup, and task behavior remain in services, guards, and strategies.
- Configuration is validated before infrastructure initialization. Startup fails for missing MongoDB/JWT settings, weak JWT secrets, invalid ports, or unsupported token-duration formats.
- Password protection is layered: bcrypt hashing, `select: false`, schema serialization transforms, and explicit safe response mapping.
- Owner checks are included directly in task database filters rather than applied after loading a record.
- Public and admin task lists use the same validated query contract and pagination envelope.
- The production image is built in stages, contains only production dependencies and compiled output, and runs as the unprivileged `node` user.
- Compose does not publish MongoDB to the host; only the API port is exposed. MongoDB data persists in a named volume.

## Manual request examples

The `requests/` directory contains ready-to-run HTTP examples for authentication, owner task flows, query features, and administration. Replace sample IDs where indicated. Equivalent requests can be exercised interactively through Swagger.
