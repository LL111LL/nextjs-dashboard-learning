import {
  describe,
  expect,
  it,
} from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("返回应用存活状态", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(
      response.headers.get("content-type"),
    ).toContain("application/json");

    expect(
      response.headers.get("cache-control"),
    ).toBe("no-store");

    expect(body).toEqual({
      status: "ok",
      service: "nextjs-dashboard",
      checks: {
        application: "up",
      },
    });
  });
});