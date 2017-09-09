import * as http from 'http'
import { Request, Response, RequestHandler, NextFunction } from 'express'
import { Server as StockingsServer, ConnectionRequest, MergeStrategy } from 'stockings'
import { StockingsConnection } from 'stockings/src/stockingsConnection'
import './customTypings/express-bindings'

const TOKEN_HEADER = 'client-token'
const SUBSCRIPTION_HEADER = 'client-subscriptions'

export const Connection = StockingsConnection

export interface MiddlewareOptions {
  server: http.Server | number
  privateKey: string
  publicKey?: string
  algorithm?: string
  requestFilter?: (req: ConnectionRequest) => boolean
  disposeMetaAfter?: number
}

export function middleware (options: MiddlewareOptions): RequestHandler {
  function getAddress (req: Request) {
    return req.header('x-forwarded-for') || req.connection.remoteAddress
  }

  let httpServer: http.Server
  if (typeof options.server === 'number') {
    httpServer = http.createServer()
    httpServer.listen(options.server)
  } else {
    httpServer = options.server
  }

  const stockings = new StockingsServer({
    server: httpServer,
    privateKey: options.privateKey,
    publicKey: options.publicKey,
    requestFilter: options.requestFilter,
    algorithm: options.algorithm,
    disposeMetaAfter: options.disposeMetaAfter
  })

  return function middleware (req: Request, res: Response, next: NextFunction) {
    const token = req.header(TOKEN_HEADER)
    let client: StockingsConnection
    let transactionId: string

    req.hasStockingsClient = () => {
      return !!client
    }

    res.subscribe = (type: string, mergeStrategy?: MergeStrategy, upsertKey?: string): number => {
      if (!client) {
        return 0
      }
      if (!transactionId) {
        transactionId = client.generateTransactionId()
      }
      const count = client.addSubscription(type, transactionId, mergeStrategy, upsertKey)
      res.setHeader(SUBSCRIPTION_HEADER, client.getSubscriptionHeader(transactionId))
      return count
    }

    res.broadcast = <T>(type: string, payload: T, cb?: (err: any) => void) => {
      stockings.sendData(type, payload, cb)
    }

    if (token) {
      stockings.getConnection(token, getAddress(req)).then((_client) => {
        client = _client
        next()
      }).catch()
    } else {
      next()
    }
  }
}
