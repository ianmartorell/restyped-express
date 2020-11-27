import * as express from 'express-serve-static-core'
import {RestypedBase, RestypedRoute} from 'restyped'

export interface TypedRequest<T extends RestypedRoute> extends express.Request {
  body: T['body']
  params: T['params']
  query: T['query']
}

type Handler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void

type HandlerOrArray = Handler | Handler[]

type TypedHandler<T extends RestypedRoute, Response> = (
  req: TypedRequest<T>,
  res: express.Response
) => Promise<Response>

type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'

export default function RestypedRouter<APIDef extends RestypedBase>(
  app: express.Express | express.Router
) {
  const createAsyncRoute = function<
    Path extends keyof APIDef,
    Method extends HTTPMethod
  >(
    path: Path,
    method: Method,
    handler: TypedHandler<
      APIDef[Path][Method],
      APIDef[Path][Method]['response']
    >,
    middlewares: HandlerOrArray[]
  ) {
    const handlers = [];
    middlewares.forEach(m => Array.isArray(m) ? handlers.push(...m) : handlers.push(m))
    handlers.push(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        handler(req, res)
          .then(result => {
            if (!res.headersSent) {
              res.send(result)
            }
          })
          .catch(err => {
            next(err)
          })
      }
    )

    const route: express.IRouterMatcher<void> = app[method.toLowerCase()].bind(
      app
    )
    route(path as string, handlers)
  }

  function router(req: express.Request, res: express.Response, next: express.NextFunction) {
    app(req, res, next);
  }

  router.use = app.use.bind(app);
  router.route = createAsyncRoute;
  router.get = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['GET'],
      APIDef[Path]['GET']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'GET', handler, middlewares)
  };
  router.post = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['POST'],
      APIDef[Path]['POST']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'POST', handler, middlewares)
  };
  router.put = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['PUT'],
      APIDef[Path]['PUT']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'PUT', handler, middlewares)
  };
  router.delete = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['DELETE'],
      APIDef[Path]['DELETE']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'DELETE', handler, middlewares)
  };
  router.patch = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['PATCH'],
      APIDef[Path]['PATCH']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'PATCH', handler, middlewares)
  };
  router.options = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['OPTIONS'],
      APIDef[Path]['OPTIONS']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'OPTIONS', handler, middlewares)
  };
  router.head = function<Path extends keyof APIDef>(
    path: Path,
    handler: TypedHandler<
      APIDef[Path]['HEAD'],
      APIDef[Path]['HEAD']['response']
    >,
    ...middlewares: HandlerOrArray[]
  ) {
    return createAsyncRoute(path, 'HEAD', handler, middlewares)
  }

  return router;
}
