import { NextResponse } from "next/server";
import {
  createServiceStatus,
} from "@/app/lib/service-status";

export async function GET() {
  return NextResponse.json(
    createServiceStatus("ok"),
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}