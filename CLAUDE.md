# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn dev                  # Start dev server with nodemon (NODE_ENV=development)
yarn start                # Start production server via PM2

# Testing
yarn test                 # Run all tests (Jest, in-band, verbose)
yarn test:watch           # Run tests in watch mode
yarn coverage             # Run tests with coverage report

# Run a single test file
yarn test -- tests/integration/user.test.js

# Linting & Formatting
yarn lint                 # ESLint check
yarn lint:fix             # ESLint auto-fix
yarn prettier             # Prettier check
yarn prettier:fix         # Prettier auto-fix

# Docker
yarn docker:dev           # Docker dev mode
yarn docker:prod          # Docker production mode
yarn docker:test          # Docker test mode
```

## Environment Setup

Copy `.env.example` to `.env`. Required variables:
- `NODE_ENV` — `development` | `production` | `test`
- `MONGODB_URL` — MongoDB connection string (test environment appends `-test` automatically)
- `JWT_SECRET` — Secret for signing JWTs
- `JWT_ACCESS_EXPIRATION_MINUTES` — Access token TTL (default 30)
- `JWT_REFRESH_EXPIRATION_DAYS` — Refresh token TTL (default 30)
- `SMTP_*` / `EMAIL_FROM` — Email service (optional; needed for password reset / email verification)

Config is validated at startup via Joi in `src/config/config.js` — the server will throw if required vars are missing.

## Architecture

This is a Node.js/Express REST API with MongoDB (Mongoose). All API routes are versioned under `/v1`.

**Request lifecycle:**
```
Route → validate middleware (Joi) → auth middleware (Passport JWT) → Controller → Service → Mongoose Model
```

**Layer responsibilities:**
- `src/routes/v1/` — Route definitions; attach `validate()` and `auth()` middlewares here
- `src/controllers/` — Thin HTTP layer; use `catchAsync` wrapper, delegate logic to services
- `src/services/` — Business logic; throw `ApiError` for domain errors
- `src/models/` — Mongoose schemas; all models attach the `toJSON` and `paginate` plugins
- `src/validations/` — Joi schemas for request body/query/params validation
- `src/middlewares/error.js` — Centralized error handler; converts errors to `ApiError` and formats JSON responses
- `src/config/` — App config, logger, Morgan, Passport strategy, roles, token types

**Auth flow:**
- `POST /v1/auth/register` or `/login` returns both an access token (30 min) and a refresh token (30 days)
- Access tokens are JWT Bearer tokens validated by the `auth()` middleware via `passport-jwt`
- Refresh, reset-password, and verify-email tokens are persisted in the `Token` collection
- Roles: `user` (no special rights) and `admin` (`getUsers`, `manageUsers`). Rights are defined in `src/config/roles.js`
- `auth('manageUsers')` checks that the user's role has the required right; users can always access their own resources regardless of rights

**Error handling:**
```js
// In controllers — always wrap with catchAsync:
const doSomething = catchAsync(async (req, res) => { ... });

// In services — throw ApiError:
throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
```

**Mongoose plugins (applied to every model):**
- `toJSON` — strips `__v`, `createdAt`, `updatedAt`, and fields with `private: true`; replaces `_id` with `id`
- `paginate` — adds `Model.paginate(filter, { sortBy, limit, page })` returning `{ results, page, limit, totalPages, totalResults }`

**Docs:** Swagger UI is available at `http://localhost:3000/v1/docs` in development mode only. Swagger annotations live in the route files and `src/docs/`.

## Testing Conventions

Integration tests live in `tests/integration/`, unit tests in `tests/unit/`. Tests use:
- `tests/fixtures/` — Pre-built user/token objects and `insertUsers()` helper
- `tests/utils/setupTestDB.js` — Call `setupTestDB()` at the top of integration tests; it connects to the `-test` DB, wipes all collections before each test, and disconnects after all tests

## Linting

ESLint follows the [Airbnb base](https://github.com/airbnb/javascript) style guide with Prettier integration. Husky runs lint-staged on pre-commit. Configuration files: `.eslintrc.json`, `.prettierrc.json`.
