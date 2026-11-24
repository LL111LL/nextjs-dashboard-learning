import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(),
}));

import { neon } from "@neondatabase/serverless";
import { GET } from "./route";

const queryMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();

  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://test:test@example.com/test",
  );

  vi.mocked(neon).mockReturnValue({
    query: queryMock,
  } as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/ready", () => {
  it("数据库查询成功时返回 200", async () => {
    queryMock.mockResolvedValue([{ ok: 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control"))
      .toBe("no-store");

    expect(body).toEqual({
      status: "ready",
      service: "nextjs-dashboard",
      checks: {
        application: "up",
        database: "up",
      },
    });

    expect(queryMock).toHaveBeenCalledWith(
      "SELECT 1 AS ok",
      [],
      {
        fetchOptions: {
          signal: expect.any(AbortSignal),
        },
      },
    );
  });

  it("缺少数据库地址时返回 503", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after"))
      .toBe("10");

    expect(body.checks).toEqual({
      application: "up",
      database: "down",
    });

    expect(neon).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("数据库查询失败时返回 503", async () => {
    queryMock.mockRejectedValue(
      new Error("模拟连接失败"),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after"))
      .toBe("10");

    expect(body).toEqual({
      status: "unavailable",
      service: "nextjs-dashboard",
      checks: {
        application: "up",
        database: "down",
      },
    });
  });
});