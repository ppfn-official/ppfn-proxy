/**
 * async-request-handler
 *
 * @see https://www.npmjs.com/package/async-request-handler
 */

import type {ErrorRequestHandler, Request, RequestHandler} from "express";

/**
 * returns async RequestHandler which concatenates the first `handler` and more `handlers` including ErrorRequestHandler.
 */
export declare function ASYNC(handler: RequestHandler, ...handlers: (RequestHandler | ErrorRequestHandler)[]): RequestHandler;

/**
 * returns async ErrorRequestHandler which catches Promise rejection thrown from `handler`.
 */
export declare function CATCH(handler: ErrorRequestHandler): ErrorRequestHandler;

/**
 * returns async ErrorRequestHandler which runs one of `THEN` or `ELSE` handlers after `COND` tester returns a boolean.
 */
export declare function IF(COND: (req: Request) => (boolean | Promise<boolean>), THEN: RequestHandler, ELSE?: RequestHandler): RequestHandler;
