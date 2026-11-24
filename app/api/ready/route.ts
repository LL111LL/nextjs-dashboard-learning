import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import {
  createServiceStatus,
} from "@/app/lib/service-status";

const DATABASE_TIMEOUT_MS = 3000;

function unavailableResponse() {
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
      },
    },
  );
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return unavailableResponse();
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
      return unavailableResponse();
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
        },
      },
    );
  } catch {
    // 不把数据库地址、驱动错误或网络信息返回给客户端。
    return unavailableResponse();
  }
}