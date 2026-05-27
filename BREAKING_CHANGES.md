# Breaking Changes

## v0.1.0 — Full type inference, typed route handlers

### `Schemas` is no longer a generic type

**Before (v0.0.5):**
```ts
import { validate } from 'zod-express-validator';

const middleware = validate<ParamsType, QueryType, BodyType, ResType>({
  params: paramsSchema,
  query: querySchema,
  body: bodySchema,
});
```

**After (v0.1.0):**
```ts
import { validate } from 'zod-express-validator';

const middleware = validate({
  params: paramsSchema,
  query: querySchema,
  body: bodySchema,
});
```

Remove all explicit type arguments from `validate()` calls. Types are now inferred automatically from the schemas you pass.

---

### `ValidationError` and `RequestValidationError` are no longer generic

**Before (v0.0.5):**
```ts
import { ValidationError, RequestValidationError } from 'zod-express-validator';

const handler = (err: RequestValidationError<Params, Query, Body>) => { ... };
const cb = (errors: ValidationError<Params, Query, Body>, res: Response) => { ... };
```

**After (v0.1.0):**
```ts
import { ValidationError, RequestValidationError } from 'zod-express-validator';

const handler = (err: RequestValidationError) => { ... };
const cb = (errors: ValidationError, res: Response) => { ... };
```

Remove all type parameters from `ValidationError` and `RequestValidationError` usages.

---

### `validate()` return type changed from `RequestHandler<P, R, B, Q>` to `Validator<T>`

**Before (v0.0.5):** `validate()` returned `RequestHandler<P, R, B, Q>` with explicit generics tied to each request part.

**After (v0.1.0):** `validate()` returns `Validator<T>`, a branded `RequestHandler` that carries the full schema type `T`. At runtime the value is identical.

This enables the new controller typing pattern:

```ts
const myValidator = validate({ query: mySchema, body: bodySchema });

// Controller type is fully derived from the validator — no duplication:
type MyController = TypedRequestHandler<typeof myValidator>;

const controller: MyController = (req, res) => {
  req.body;  // typed
  req.query; // typed
};
```

Existing code that stores the return value as `RequestHandler` continues to compile — `Validator<T>` extends `RequestHandler`.

---

### `IRouterMatcher` overloads — route handler typing

The library now augments Express's `IRouterMatcher` interface. When a `Validator` is the second argument to a route method, the final handler is contextually typed:

```ts
app.get(
  '/users/:id',
  validate({ params: z.object({ id: z.coerce.number() }) }),
  (req, res) => {
    req.params.id; // number — fully typed, no cast needed
  },
);
```

If an existing route handler relies on the looser Express types and is structurally incompatible with the inferred schema types, TypeScript will now surface that error.

---

## v0.0.5 — Zod v4

### Zod v4 is now required

The `zod` peer dependency was upgraded from `^3.22.2` to `^4.3.6`. **Zod v3 is no longer supported.**

**Migration:** Upgrade your `zod` dependency to v4.

```bash
npm install zod@^4.3.6
# or
pnpm add zod@^4.3.6
```

---

## v0.0.4 — Express 5 only

### Express 4 is no longer supported

The `express` peer dependency was updated to `5.1.0`. Express 4 is no longer a supported peer.

**Migration:** Upgrade your application to Express 5.

```bash
npm install express@^5.1.0
# or
pnpm add express@^5.1.0
```
