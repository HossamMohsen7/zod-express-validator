# zod-express-validator

A package to validate [Express](https://www.npmjs.com/package/express) request and response payloads using [Zod](https://www.npmjs.com/package/zod).

Inspired by [zod-express-middleware](https://www.npmjs.com/package/zod-express-middleware)

## Requirements

| Peer dependency | Version  |
| --------------- | -------- |
| `express`       | `^5.0.0` |
| `zod`           | `^4.0.0` |

## Installation

```bash
npm install zod-express-validator
# or
yarn add zod-express-validator
# or
pnpm add zod-express-validator
```

## Usage

### Basic

Pass `validate(schemas, onError?)` as a middleware. The next handler receives a fully typed `req` — no casts needed.

```typescript
import express from "express";
import z from "zod";
import { validate } from "zod-express-validator";

const app = express();
app.use(express.json());

const bodySchema = z.object({
  name: z.string().min(3).max(255),
});

const paramsSchema = z.object({
  userId: z.coerce.number(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).max(100),
});

const responseSchema = z.object({
  success: z.boolean(),
});

app.post(
  "/info/:userId",
  validate(
    {
      body: bodySchema,
      params: paramsSchema,
      query: querySchema,
      res: responseSchema,
    },
    ({ bodyError, paramsError, queryError }, res) => {
      const error = bodyError ?? paramsError ?? queryError;
      return res.status(400).json({ error: error?.message });
    },
  ),
  (req, res) => {
    const body = req.body;   // { name: string }
    const params = req.params; // { userId: number }
    const query = req.query;  // { page: number }

    // res.json is type-checked against responseSchema
    return res.status(200).json({ success: true });
  },
);
```

> **Note:** Any schema can be omitted if you don't need to validate that part of the request.  
> **Important:** For `params` and `query`, always use `z.coerce` — these values arrive as strings from the URL.

---

### Usage with Controllers

Extract the validator to a variable and derive the controller type from it using `TypedRequestHandler`. This keeps schemas, middleware, and controller all in sync from a single declaration.

```typescript
import express from "express";
import z from "zod";
import { validate, TypedRequestHandler } from "zod-express-validator";

const app = express();
app.use(express.json());

const bodySchema = z.object({
  name: z.string().min(3).max(255),
});

const paramsSchema = z.object({
  userId: z.coerce.number(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).max(100),
});

const responseSchema = z.object({
  success: z.boolean(),
});

const validator = validate(
  {
    body: bodySchema,
    params: paramsSchema,
    query: querySchema,
    res: responseSchema,
  },
  ({ bodyError, paramsError, queryError }, res) => {
    const error = bodyError ?? paramsError ?? queryError;
    return res.status(400).json({ error: error?.message });
  },
);

const controller: TypedRequestHandler<typeof validator> = (req, res) => {
  const body = req.body;    // { name: string }
  const params = req.params;  // { userId: number }
  const query = req.query;   // { page: number }

  return res.status(200).json({ success: true });
};

app.post("/info/:userId", validator, controller);
```

---

### Error Handling

If validation fails, the `onZodErrors` callback is called with a [`ValidationError`](#api) containing the errors for each part of the request.

If no callback is provided, a `RequestValidationError` is forwarded to `next()` for Express's error-handling middleware to process:

```typescript
app.use((err, req, res, next) => {
  if (err instanceof RequestValidationError) {
    const { paramsError, queryError, bodyError } = err.errors;
    return res.status(400).json({ paramsError, queryError, bodyError });
  }
  next(err);
});
```

---

## API

### `validate(schemas, onZodErrors?)`

Returns a `Validator<T>` middleware that validates the request before passing control to the next handler.

| Parameter     | Type                                                        | Description                                                                                  |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `schemas`     | `Schemas`                                                   | Zod schemas for `params`, `query`, `body`, and/or `res`.                                     |
| `onZodErrors` | `(errors: ValidationError, res: Response) => Response \| never` | Optional. Called on validation failure. Omit to forward a `RequestValidationError` to `next`. |

---

### Types

| Type                        | Description                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `Schemas`                   | Shape of the object passed to `validate()`. All fields are optional.                               |
| `Validator<T>`              | Return type of `validate()`. Extends `RequestHandler` and carries the schema type for inference.   |
| `TypedRequestHandler<T>`    | Type for a controller derived from a `Validator<T>` or a `Schemas` object.                         |
| `TypedRequest<T>`           | A typed `Request` with `params`, `body`, and `query` replaced by their Zod-inferred types.         |
| `InferSchemas<T>`           | Utility type that extracts the inferred `params` / `query` / `body` / `res` types from a `Schemas`. |
| `ValidationError`           | Object containing `paramsError?`, `queryError?`, `bodyError?` as `ZodError` instances.             |
| `RequestValidationError`    | Error subclass forwarded to `next()` when no `onZodErrors` is provided. Contains `.errors`.        |

---

## Versioning

This package uses [SemVer](https://semver.org/) for versioning. See [CHANGELOG.md](./CHANGELOG.md) and [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) for version history.

## Contributing & Issues

Feel free to open an issue or a pull request if you have any suggestions or if you found a bug.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
