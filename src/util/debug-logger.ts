import crypto from "crypto";

export class DebugLogger {
  id: string;
	initTime: number;
  lastLogTime: number | null;
  constructor() {
    this.id = crypto.randomUUID();
    this.lastLogTime = null;
		this.initTime = performance.now()
  }

  log(message: string, params?: object) {
    if (process.env.DEBUG !== "true") return;
    const now = performance.now();
		const msSinceInit = Math.round((now - this.initTime) *1000)/1000
    const msSinceLast =
      this.lastLogTime === null
        ? null
        : Math.round((now - this.lastLogTime) * 1000) / 1000;
    console.log(message, { id: this.id, msSinceInit, msSinceLast, ...(params || {}) });
    this.lastLogTime = now;
  }
}
