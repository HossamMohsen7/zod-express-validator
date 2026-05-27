import z from "zod";
import express, {
  type Request,
  type RequestHandler,
  type Response,
  type NextFunction,
} from "express";

// Alias for z.ZodType<any, any, any>; avoids @typescript-eslint/no-explicit-any at every use
// site and prevents the deep-recursion issues introduced in Zod v4.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodSchema = z.ZodType;

/** Schemas for each part of an Express request/response to validate against. */
export type Schemas = {
  params?: AnyZodSchema;
  query?: AnyZodSchema;
  body?: AnyZodSchema;
  res?: AnyZodSchema;
};

/** Zod errors produced during request validation, keyed by request part. */
export type ValidationError = {
  paramsError?: z.ZodError;
  queryError?: z.ZodError;
  bodyError?: z.ZodError;
};

export class RequestValidationError extends Error {
  readonly name = "RequestValidationError";
  constructor(public errors: ValidationError) {
    super("Request validation error");
  }
}

// Patch express.request so req.query can be replaced after validation.
// Express 5 makes query read-only via a getter; we need a settable descriptor.
const descriptor = Object.getOwnPropertyDescriptor(express.request, "query");
if (descriptor) {
  Object.defineProperty(express.request, "query", {
    get(this: Request) {
      return this._query ?? descriptor.get?.call(this);
    },
    set(this: Request, query: unknown) {
      this._query = query;
    },
    configurable: true,
    enumerable: true,
  });
}

/** Infers the validated params / query / body / res types from a {@link Schemas} object. */
export type InferSchemas<T extends Schemas> = {
  params: T["params"] extends AnyZodSchema
    ? z.infer<T["params"]>
    : Record<string, string>;
  query: T["query"] extends AnyZodSchema
    ? z.infer<T["query"]>
    : Record<string, unknown>;
  body: T["body"] extends AnyZodSchema ? z.infer<T["body"]> : unknown;
  res: T["res"] extends AnyZodSchema ? z.infer<T["res"]> : unknown;
};

/**
 * A typed `Request` with `params`, `body`, and `query` replaced by their
 * Zod-inferred counterparts. Use `Omit` + intersection so property lookups
 * resolve to the narrowed types rather than the loose `any` generics on the
 * base `Request`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedRequest<T extends Schemas> = Omit<
  Request<any, any, any, any>,
  "params" | "body" | "query"
> & {
  params: InferSchemas<T>["params"];
  body: InferSchemas<T>["body"];
  query: InferSchemas<T>["query"];
};

/**
 * The value returned by {@link validate}. At runtime it is a plain Express
 * `RequestHandler`; the phantom `__zev_schemas` brand lets TypeScript recover
 * the schemas inside `TypedRequestHandler<typeof myValidator>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Validator<T extends Schemas> = RequestHandler<
  any,
  any,
  any,
  any
> & {
  readonly __zev_schemas: T;
};

/**
 * A typed Express route handler. Accepts either a `Schemas` object or a
 * `Validator<S>` returned by {@link validate}:
 *
 * ```ts
 * const v = validate({ query: mySchema });
 * type Controller = TypedRequestHandler<typeof v>;
 * ```
 */
export type TypedRequestHandler<T> =
  T extends Validator<infer S extends Schemas>
    ? (
        req: TypedRequest<S>,
        res: Response<InferSchemas<S>["res"]>,
        next: NextFunction,
      ) => void | Promise<void>
    : T extends Schemas
      ? (
          req: TypedRequest<T>,
          res: Response<InferSchemas<T>["res"]>,
          next: NextFunction,
        ) => void | Promise<void>
      : never;

/**
 * Returns an Express middleware that validates `params`, `query`, and `body`
 * against the provided Zod schemas. On failure, calls `onZodErrors` if
 * supplied, otherwise forwards a {@link RequestValidationError} to `next`.
 *
 * The returned {@link Validator} is branded with the schemas so a controller
 * type can be derived via `TypedRequestHandler<typeof theValidator>`.
 */
export const validate = <const T extends Schemas>(
  schemas: T,
  onZodErrors?: (errors: ValidationError, res: Response) => Response | never,
): Validator<T> => {
  const middleware: RequestHandler = (req, res, next) => {
    const error: ValidationError = {};

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.success) req.params = result.data as any;
      else error.paramsError = result.error;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.success) req.query = result.data as any;
      else error.queryError = result.error;
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) req.body = result.data;
      else error.bodyError = result.error;
    }

    if (error.paramsError || error.queryError || error.bodyError) {
      if (onZodErrors) onZodErrors(error, res);
      else next(new RequestValidationError(error));
    } else {
      next();
    }
  };

  return middleware as Validator<T>;
};

declare module "express-serve-static-core" {
  interface Request {
    /** Stores the validated query set by the zod-express-validator patch. */
    _query?: unknown;
  }

  interface IRouterMatcher<
    T,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Method extends
      | "all"
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head" = any,
  > {
    /** validator + single typed handler */
    <S extends Schemas>(
      path: PathParams,
      validator: Validator<S>,
      handler: (
        req: TypedRequest<S>,
        res: Response<InferSchemas<S>["res"]>,
        next: NextFunction,
      ) => void | Promise<void>,
    ): T;
    /** validator + optional middleware chain + typed final handler */
    <S extends Schemas>(
      path: PathParams,
      validator: Validator<S>,
      ...handlers: [
        ...RequestHandler[],
        (
          req: TypedRequest<S>,
          res: Response<InferSchemas<S>["res"]>,
          next: NextFunction,
        ) => void | Promise<void>,
      ]
    ): T;
  }
}
