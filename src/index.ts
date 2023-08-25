import { RequestHandler, Response } from "express";
import z from "zod";

export declare type Schemas<TParams, TQuery, TBody, TRes> = {
  params?: z.ZodSchema<TParams>;
  query?: z.ZodSchema<TQuery>;
  body?: z.ZodSchema<TBody>;
  res?: z.ZodSchema<TRes>;
};

export declare type ValidationError<TParams, TQuery, TBody> = {
  paramsError?: z.ZodError<TParams>;
  queryError?: z.ZodError<TQuery>;
  bodyError?: z.ZodError<TBody>;
};

export const validate =
  <P, Q, B, R>(
    schemas: Schemas<P, Q, B, R>,
    onZodErrors: (errors: ValidationError<P, Q, B>, res: Response) => Response
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
        req.query = result.data;
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
      onZodErrors(error, res);
    } else {
      next();
    }
  };
