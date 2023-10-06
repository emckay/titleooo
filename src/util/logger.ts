import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

export class Logger {
  id: string;
  initTime: number;
  lastLogTime: number | null;
  debugOnly: boolean;

  constructor(debugOnly?: boolean) {
    this.debugOnly = debugOnly ?? false;
    this.id = crypto.randomUUID();
    this.lastLogTime = null;
    this.initTime = performance.now();
  }

  log(message: string, params?: object) {
    if (this.debugOnly && process.env.DEBUG !== "true") return;
    const now = performance.now();
    const msSinceInit = Math.round((now - this.initTime) * 1000) / 1000;
    const msSinceLast =
      this.lastLogTime === null
        ? null
        : Math.round((now - this.lastLogTime) * 1000) / 1000;
    console.log(message, {
      id: this.id,
      msSinceInit,
      msSinceLast,
      ...(params || {}),
    });
    this.lastLogTime = now;
  }
}

export const withTiming =
  (
    message: string,
    routeHandler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<void>,
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const start = performance.now();
    try {
      return await routeHandler(req, res, next);
    } finally {
      console.log(
        `${message}`,
        JSON.stringify({
          time: Math.round((performance.now() - start) * 1000) / 1000,
          param: req.params[0],
        }),
      );
    }
  };
