type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
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
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg)
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
