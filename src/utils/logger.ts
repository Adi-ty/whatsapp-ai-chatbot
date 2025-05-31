type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private logLevel: LogLevel;
  private maxObjectDepth: number = 3;
  private maxStringLength: number = 1000;
  private sensitiveKeys = new Set([
    "password",
    "apikey",
    "token",
    "secret",
    "auth",
    "key",
    "pass",
    "pwd",
    "credential",
    "authorization",
  ]);

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  private sanitizeObject(obj: any, depth = 0): any {
    if (depth > this.maxObjectDepth) {
      return "[Object depth limit exceeded]";
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === "string") {
      return obj.length > this.maxStringLength
        ? obj.substring(0, this.maxStringLength) + "...[truncated]"
        : obj;
    }

    if (typeof obj !== "object") {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.length > 10
        ? [...obj.slice(0, 10), `...[${obj.length - 10} more items]`]
        : obj.map((item) => this.sanitizeObject(item, depth + 1));
    }

    // Handle objects
    try {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Redact sensitive keys
        if (this.sensitiveKeys.has(lowerKey)) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitizeObject(value, depth + 1);
        }
      }
      return sanitized;
    } catch (error) {
      // Handle circular references or other issues
      return "[Object could not be serialized]";
    }
  }

  private safeStringify(obj: any): string {
    try {
      const sanitized = this.sanitizeObject(obj);
      return JSON.stringify(sanitized, null, 2);
    } catch (error) {
      return `[Error stringifying object: ${
        error instanceof Error ? error.message : "Unknown error"
      }]`;
    }
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ` ${args
            .map((arg) =>
              typeof arg === "object" ? this.safeStringify(arg) : String(arg)
            )
            .join(" ")}`
        : "";
    return `[${level.toUpperCase()}] ${timestamp}: ${message}${formattedArgs}`;
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, ...args));
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, ...args));
    }
  }
}

export const logger = new Logger();
