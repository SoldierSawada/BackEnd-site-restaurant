import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers';
import { injectable } from 'inversify';
import { NextFunction, Request, Response } from 'express';
import { DomainError } from 'ddd';



@Middleware({ type: 'after' })
@injectable()
export class DomainErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: unknown, _request: Request, response: Response, next: NextFunction): void {
    if (response.headersSent) {
      return next(error);
    }

    if (error instanceof DomainError) {
      response.status(400).json({ error: error.name, message: error.message });
      return;
    }

    if (error instanceof HttpError) {
      const details = (error as HttpError & { errors?: unknown }).errors;
      response.status(error.httpCode).json({
        error: error.name,
        message: error.message,
        ...(details ? { details } : {}),
      });
      return;
    }

    console.error(error);
    response.status(500).json({ error: 'InternalServerError' });
  }
}
