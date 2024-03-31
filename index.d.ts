import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        sub: string;
        orgId?: string;
      };
    }
  }
}
