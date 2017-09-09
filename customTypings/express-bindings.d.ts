import 'express'
import { MergeStrategy } from 'stockings'

declare global {
  namespace Express {
    interface Request {
      hasStockingsClient: () => boolean
    }
    interface Response {
      subscribe: (eventId: string, mergeStrategy?: MergeStrategy, upsertKey?: string) => number
      broadcast: <T>(eventId: string, payload: T, cb?: (err: any) => void) => void
    }
  }
}