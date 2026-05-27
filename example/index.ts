import express from "express";
import z from "zod";
import {
  validate,
  TypedRequestHandler,
  RequestValidationError,
} from "../src/index";

const app = express();
app.use(express.json());

// ── Schemas ────────────────────────────────────────────────────────────────

const userParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const createUserSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.email(),
});

const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});

const listResponseSchema = z.object({
  users: z.array(userResponseSchema),
  page: z.number(),
  limit: z.number(),
});

// ── Example 1: inline handler ──────────────────────────────────────────────
//
// The handler immediately after validate() receives a fully typed req.
// No TypeScript casts needed.

app.get(
  "/users/:userId",
  validate(
    {
      params: userParamsSchema,
      res: userResponseSchema,
    },
    ({ paramsError }, res) => {
      return res.status(400).json({ error: paramsError?.message });
    },
  ),
  (req, res) => {
    const { userId } = req.params; // number

    // Simulate a DB lookup
    res.status(200).json({ id: userId, name: "Alice", email: "alice@example.com" });
  },
);

// ── Example 2: controller pattern ─────────────────────────────────────────
//
// Extract the validator so its type can drive the controller's signature via
// TypedRequestHandler<typeof listValidator>. Schemas, middleware, and
// controller are all derived from a single declaration.

const listUsersValidator = validate(
  {
    query: paginationSchema,
    res: listResponseSchema,
  },
  ({ queryError }, res) => {
    return res.status(400).json({ error: queryError?.message });
  },
);

const listUsersController: TypedRequestHandler<typeof listUsersValidator> = (
  req,
  res,
) => {
  const { page, limit } = req.query; // { page: number; limit: number }

  // Simulate a paginated DB result
  res.status(200).json({
    users: [{ id: 1, name: "Alice", email: "alice@example.com" }],
    page,
    limit,
  });
};

app.get("/users", listUsersValidator, listUsersController);

// ── Example 3: body validation ─────────────────────────────────────────────

app.post(
  "/users",
  validate(
    {
      body: createUserSchema,
      res: userResponseSchema,
    },
    ({ bodyError }, res) => {
      return res.status(400).json({ error: bodyError?.message });
    },
  ),
  (req, res) => {
    const { name, email } = req.body; // { name: string; email: string }

    // Simulate creating a user
    res.status(201).json({ id: 2, name, email });
  },
);

// ── Error handling middleware ──────────────────────────────────────────────
//
// Catches RequestValidationError forwarded by validate() when no
// onZodErrors callback is provided.

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err instanceof RequestValidationError) {
      const { paramsError, queryError, bodyError } = err.errors;
      const first = paramsError ?? queryError ?? bodyError;
      return res.status(400).json({ error: first?.message ?? "Validation error" });
    }
    next(err);
  },
);

// ── Start ──────────────────────────────────────────────────────────────────

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("  GET  /users          — paginated list (query: page, limit)");
  console.log("  GET  /users/:userId  — single user (params: userId)");
  console.log("  POST /users          — create user (body: name, email)");
});
