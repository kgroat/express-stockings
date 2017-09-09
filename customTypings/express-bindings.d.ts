import 'express'
import { MergeStrategy } from 'stockings'

type SubscribeMethod = 
  ((eventId: string) => number) |
  ((eventId: string, mergeStrategy: 'replace') => number) |
  ((eventId: string, mergeStrategy: 'append') => number) |
  ((eventId: string, mergeStrategy: 'prepend') => number) |
  ((eventId: string, mergeStrategy: 'upsert', upsertKey: string) => number)

declare global {
  namespace Express {
    interface Request {
      hasStockingsClient: () => boolean
    }
    interface Response {
      subscribe: SubscribeMethod
      broadcast: <T>(eventId: string, payload: T, cb?: (err: any) => void) => void
    }
  }
}