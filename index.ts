
import * as http from 'http';
import * as express from 'express';
import {Server as StockingsServer, ServerOptions, ConnectionRequest} from 'stockings';
import {StockingsConnection} from 'stockings/src/stockingsConnection';

const TOKEN_HEADER = 'client-token';
const SUBSCRIPTION_HEADER = 'client-subscriptions';

declare module 'express' {
  interface Request {
    hasClient: () => boolean;
  }
  interface Response {
    subscribe: (eventId: string) => number;
    broadcast: <T>(eventId: string, payload: T) => void;
  }
}

export var Connection = StockingsConnection;

export interface MiddlewareOptions {
  server: http.Server | number;
  privateKey: string;
  publicKey?: string;
  requestFilter?: (req: ConnectionRequest) => boolean;
  algorithm?: string;
  disposeMetaAfter?: number;
}

export function middleware(options: ServerOptions): express.RequestHandler {
  function getAddress(req: express.Request){
    return req.header('x-forwarded-for') || req.connection.remoteAddress;
  }

  var httpServer: http.Server;
  if(typeof options.server === 'number'){
    httpServer = http.createServer();
    httpServer.listen(options.server);
  } else {
    httpServer = options.server;
  }

  var stockings = new StockingsServer({
    server: httpServer,
    privateKey: options.privateKey,
    publicKey: options.publicKey,
    requestFilter: options.requestFilter,
    algorithm: options.algorithm,
    disposeMetaAfter: options.disposeMetaAfter
  });

  return function middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    var token = req.header(TOKEN_HEADER);
    var client: StockingsConnection;
    var transactionId: string;

    req.hasClient = () => {
      return !!client;
    };

    res.subscribe = (type: string): number => {
      if(!client){
        return 0;
      }
      if(!transactionId){
        transactionId = client.generateTransactionId();
      }
      var count = client.addSubscription(type, transactionId)
      res.setHeader(SUBSCRIPTION_HEADER, client.getSubscriptionHeader(transactionId));
      return count;
    };
    res.broadcast = <T>(type: string, payload: T, cb?: (err: any) => void) => {
      stockings.sendData(type, payload, cb);
    };

    if(token){
      stockings.getConnection(token, getAddress(req)).then((_client) => {
        client = _client;
        next();
      });
    } else {
      next();
    }
  }
}