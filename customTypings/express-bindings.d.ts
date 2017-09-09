import 'express'
import { MergeStrategy } from 'stockings'

declare global {
  namespace Express {
    interface Request {
      hasClient: () => boolean
    }
    interface Response {
      subscribe: (eventId: string, mergeStrategy?: MergeStrategy) => number
      broadcast: <T>(eventId: string, payload: T, cb?: (err: any) => void) => void
    }
  }
}