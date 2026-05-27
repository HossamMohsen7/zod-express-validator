# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-05-27

This is the first minor release and contains **breaking changes**. See [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) for full migration guidance.

### Breaking

- `Schemas` is no longer a generic type. `Schemas<TParams, TQuery, TBody, TRes>` is replaced with a non-generic `Schemas`; all types are inferred automatically from the schemas passed to `validate()`.
- `ValidationError` is no longer generic — remove all type parameters from usages.
- `RequestValidationError` is no longer generic — remove all type parameters from usages.
- `validate()` signature changed. Was `<P, Q, B, R>(schemas, onZodErrors?) => RequestHandler<P, R, B, Q>`; now `<T extends Schemas>(schemas, onZodErrors?) => Validator<T>`. Explicit type arguments to `validate()` must be removed.

### Added

- `Validator<T>` — branded `RequestHandler` that carries the schemas it was created from, enabling `TypedRequestHandler<typeof myValidator>` to recover schema types without re-declaration.
- `InferSchemas<T>` — utility type that extracts the inferred `params` / `query` / `body` / `res` types from a `Schemas` object.
- `TypedRequest<T>` — a typed `Request` with `params`, `body`, and `query` replaced by their Zod-inferred counterparts.
- `TypedRequestHandler<T>` — a typed Express route handler; accepts either a `Schemas` object or a `Validator<S>` returned by `validate()`.
- `IRouterMatcher` declaration-merge overloads so a typed final handler passed to `router.get/post/put/...` (after a `Validator`) is fully type-checked without casts. Two forms supported: `(path, validator, handler)` and `(path, validator, ...middleware[], handler)`.
- `Request._query` augmentation on `express-serve-static-core` — formally exposes the field used by the Express 5 query-patch, removing implicit unsafe property access.
- `RequestValidationError.name` is now a `readonly` class field set to `"RequestValidationError"`, enabling reliable `err.name` checks in addition to `instanceof`.

### Fixed

- `req.query` getter now uses `?? ` (nullish coalescing) instead of a truthiness check, so a validated query that is an empty object or `0` is no longer silently discarded.

## [0.0.5] - 2025-07-26

### Changed

- **Zod v4 support** — peer dependency upgraded from `zod ^3.22.2` to `zod ^4.3.6`. Zod v3 is no longer supported.
- `Schemas` type is no longer generic. The previous `Schemas<TParams, TQuery, TBody, TRes>` signature has been replaced with a non-generic `Schemas` that uses `z.ZodTypeAny` internally, avoiding deep type recursion introduced in Zod v4.
- `ValidationError` and `RequestValidationError` types are no longer generic — type parameters `<TParams, TQuery, TBody>` have been removed.
- `validate()` now uses `<T extends Schemas>` and returns a branded `Validator<T>` instead of a plain `RequestHandler`.

### Added

- `Validator<T>` — a branded `RequestHandler` type that carries the schemas it was created from, enabling `TypedRequestHandler<typeof myValidator>` to recover schema types without re-declaration.
- `InferSchemas<T>` — utility type that extracts the inferred params / query / body / res types from a `Schemas` object.
- `TypedRequest<T>` — a typed `Request` object with validated `params`, `body`, and `query` derived from a `Schemas` object.
- `TypedRequestHandler<T>` — a typed Express route handler that accepts either a `Schemas` type or a `Validator<S>` returned by `validate()`.
- Declaration merging for `IRouterMatcher` so `TypedRequestHandler<S>` is accepted as the final handler argument to `router.get/post/put/...` without casts.

## [0.0.4] - 2025-06-24

### Fixed

- `req.query` was not being updated correctly under Express 5 due to the query property being read-only. Fixed by redefining the property descriptor on `express.request` to support both a getter and a setter.

### Changed

- Peer dependency for Express updated from `@types/express ^4.17.17` (Express 4) to `express 5.1.0` (Express 5 stable). Express 4 is no longer supported.
- Updated all development dependencies to current versions.

## [0.0.3] - 2023-09-04

### Changed

- Error handler (`onZodErrors`) is now allowed to throw. The return type changed from `Response` to `Response | never`, enabling error handlers to throw custom exceptions instead of only returning a response.

## [0.0.2] - 2023-09-04

### Added

- Support for `ZodEffects` (`.transform()`, `.refine()`, `.superRefine()`) in schema fields — `params`, `query`, `body`, and `res` now accept `z.ZodEffects<any, T>` in addition to `z.ZodSchema<T>`.
- `onZodErrors` callback is now optional. When omitted, a `RequestValidationError` is passed to `next()` so Express's default error handler (or a custom error-handling middleware) can process it.
- Usage example added to the repository.

## [0.0.1] - 2023-08-26

### Added

- Initial release.
- `validate()` middleware that validates `params`, `query`, and `body` against Zod schemas and calls an `onZodErrors` callback on failure.
- `Schemas<TParams, TQuery, TBody, TRes>` type for declaring validation schemas.
- `ValidationError` and `RequestValidationError` types.
- Express 5 compatibility via `Object.defineProperty` override on `express.request.query`.
- TypeScript support with full type inference.
