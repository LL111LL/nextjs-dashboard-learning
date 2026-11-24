import "server-only";

type LogValue =
  | string
  | number
  | boolean
  | null;

type LogContext = Record<string, LogValue>;

type LogLevel = "info" | "warn" | "error";

function writeLog(
  level: LogLevel,
  event: string,
  context: LogContext = {},
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  const message = JSON.stringify(entry);

  switch (level) {
    case "info":
      console.info(message);
      break;

    case "warn":
      console.warn(message);
      break;

    case "error":
      console.error(message);
      break;
  }
}

export const logger = {
  info(
    event: string,
    context?: LogContext,
  ) {
    writeLog("info", event, context);
  },

  warn(
    event: string,
    context?: LogContext,
  ) {
    writeLog("warn", event, context);
  },

  error(
    event: string,
    context?: LogContext,
  ) {
    writeLog("error", event, context);
  },
};