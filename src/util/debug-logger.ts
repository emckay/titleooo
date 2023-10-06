import crypto from "crypto";

export class DebugLogger {
  id: string;
  lastLogTime: number | null;
  constructor() {
    this.id = crypto.randomUUID();
    this.lastLogTime = null;
  }

  log(message: string, params?: object) {
    if (process.env.DEBUG !== "true") return;
    const now = performance.now();
    const timeElapsedMs =
      this.lastLogTime === null
        ? null
        : Math.round((now - this.lastLogTime) * 1000) / 1000;
    console.log(message, { id: this.id, timeElapsedMs, ...(params || {}) });
    this.lastLogTime = now;
  }
}
