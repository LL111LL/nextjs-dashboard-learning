import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

import { logger } from "@/app/lib/logger";
import {
  createServiceStatus,
} from "@/app/lib/service-status";

const DATABASE_TIMEOUT_MS = 3000;

function unavailableResponse(
  requestId: string,
) {
  return NextResponse.json(
    createServiceStatus(
      "unavailable",
      "down",
    ),
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "10",
        "X-Request-Id": requestId,
      },
    },
  );
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error(
      "database.readiness.missing_configuration",
      {
        requestId,
      },
    );

    return unavailableResponse(requestId);
  }

  try {
    const sql = neon(databaseUrl);

    const rows = await sql.query(
      "SELECT 1 AS ok",
      [],
      {
        fetchOptions: {
          signal: AbortSignal.timeout(
            DATABASE_TIMEOUT_MS,
          ),
        },
      },
    );

    if (rows[0]?.ok !== 1) {
      logger.warn(
        "database.readiness.unexpected_result",
        {
          requestId,
        },
      );

      return unavailableResponse(requestId);
    }

    return NextResponse.json(
      createServiceStatus(
        "ready",
        "up",
      ),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    logger.error(
      "database.readiness.failed",
      {
        requestId,
        errorType:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );

    return unavailableResponse(requestId);
  }
}