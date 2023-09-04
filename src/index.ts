import { RequestHandler, Response } from "express";
import z from "zod";

/**
 * A type that represents the schemas that will be used in the validation.
 * @property params - The schema that will be used to validate the params.
 * @property query - The schema that will be used to validate the query.
 * @property body - The schema that will be used to validate the body.
 * @property res - The schema that will be used to validate the response.
 */
export declare type Schemas<TParams, TQuery, TBody, TRes> = {
  params?: z.ZodSchema<TParams> | z.ZodEffects<any, TParams>;
  query?: z.ZodSchema<TQuery> | z.ZodEffects<any, TQuery>;
  body?: z.ZodSchema<TBody> | z.ZodEffects<any, TBody>;
  res?: z.ZodSchema<TRes> | z.ZodEffects<any, TRes>;
};

/**
 * A type that represents the errors that can occur in the validation.
 * @property paramsError - The error that occurred in the params validation.
 * @property queryError - The error that occurred in the query validation.
 * @property bodyError - The error that occurred in the body validation.
 */
export declare type ValidationError<TParams, TQuery, TBody> = {
  paramsError?: z.ZodError<TParams>;
  queryError?: z.ZodError<TQuery>;
  bodyError?: z.ZodError<TBody>;
};

export class RequestValidationError<TParams, TQuery, TBody> extends Error {
  constructor(public errors: ValidationError<TParams, TQuery, TBody>) {
    super("Request validation error");
  }
}

/**
 * Middleware that validates the params, query and body of the request. If there is any error, the onZodErrors function will be called.
 * @param schemas - The schemas that will be used in the validation. Check {@link Schemas}
 * @param onZodErrors - A function that will be called when there is any error in the validation. Check {@link ValidationError}
 */
export const validate =
  <P, Q extends PropertyDescriptor & ThisType<any>, B, R>(
    schemas: Schemas<P, Q, B, R>,
    onZodErrors?: (errors: ValidationError<P, Q, B>, res: Response) => Response
  ): RequestHandler<P, R, B, Q> =>
  (req, res, next) => {
    const error: ValidationError<P, Q, B> = {};
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        req.params = result.data;
      } else {
        error.paramsError = result.error;
      }
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        const descriptior = Object.getOwnPropertyDescriptor(req, "query") || {};
        if (descriptior.writable) {
          req.query = result.data;
        } else {
          Object.defineProperty(req, "query", {
            ...descriptior,
            value: result.data,
          });
        }
      } else {
        error.queryError = result.error;
      }
    }
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      } else {
        error.bodyError = result.error;
      }
    }
    //If there is any error
    if (error.paramsError || error.queryError || error.bodyError) {
      if (onZodErrors) {
        onZodErrors(error, res);
      } else {
        next(new RequestValidationError(error));
      }
    } else {
      next();
    }
  };
