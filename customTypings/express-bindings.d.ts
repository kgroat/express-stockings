import 'express'

declare global {
  namespace Express {
    interface Request {
      hasClient: () => boolean
    }
    interface Response {
      subscribe: (eventId: string, mergeStrategy?: (a,b)=>any) => number;
      broadcast: <T>(eventId: string, payload: T) => void;
    }
  }
}