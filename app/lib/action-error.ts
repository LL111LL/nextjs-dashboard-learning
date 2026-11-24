import "server-only";

import { logger } from "@/app/lib/logger";

export type TracedActionFailure = {
  success: false;
  message: string;
  requestId: string;
};

type CreateActionFailureOptions = {
  event: string;
  message: string;
  error?: unknown;
};

export function createTracedActionFailure({
  event,
  message,
  error,
}: CreateActionFailureOptions): TracedActionFailure {
  const requestId = crypto.randomUUID();

  logger.error(event, {
    requestId,
    errorType:
      error instanceof Error
        ? error.name
        : "UnknownError",
  });

  return {
    success: false,
    message,
    requestId,
  };
}