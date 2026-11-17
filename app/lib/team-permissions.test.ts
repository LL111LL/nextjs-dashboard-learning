import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// vi.mock 会被提升到文件顶部，
// 所以下面 import 拿到的 auth/db 已经是 Mock 版本。
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/app/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/app/db";
import {
  getTeamAccess,
  getTeamOwnerAccess,
} from "@/app/lib/team-permissions";

const TEAM_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const USER_ID = "9b2f8c14-6a3d-4e57-8b1a-2c4d6e8f0a1b";
const MEMBERSHIP_ID = "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

type MembershipRow = {
  id: string;
  role: string;
};

// 模拟 Drizzle 的链式调用：
// db.select(...).from(...).where(...).limit(1)
function mockMembershipRows(
  rows: MembershipRow[],
) {
  vi.mocked(db.select).mockReturnValue({
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  } as never);
}

function mockSignedIn() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID },
  } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getTeamAccess", () => {
  it("teamId 不是合法 UUID 时返回 invalid_team_id", async () => {
    const result = await getTeamAccess("not-a-uuid");

    expect(result).toEqual({
      ok: false,
      reason: "invalid_team_id",
    });
    expect(auth).not.toHaveBeenCalled();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("没有登录会话时返回 unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await getTeamAccess(TEAM_ID);

    expect(result).toEqual({
      ok: false,
      reason: "unauthenticated",
    });
    expect(db.select).not.toHaveBeenCalled();
  });

  it("查不到成员记录时返回 not_member", async () => {
    mockSignedIn();
    mockMembershipRows([]);

    const result = await getTeamAccess(TEAM_ID);

    expect(result).toEqual({
      ok: false,
      reason: "not_member",
    });
  });

  it("团队成员返回完整成功结果", async () => {
    mockSignedIn();
    mockMembershipRows([
      { id: MEMBERSHIP_ID, role: "member" },
    ]);

    const result = await getTeamAccess(TEAM_ID);

    expect(result).toEqual({
      ok: true,
      teamId: TEAM_ID,
      userId: USER_ID,
      membershipId: MEMBERSHIP_ID,
      role: "member",
    });
  });
});

describe("getTeamOwnerAccess", () => {
  it("普通成员返回 not_owner", async () => {
    mockSignedIn();
    mockMembershipRows([
      { id: MEMBERSHIP_ID, role: "member" },
    ]);

    const result = await getTeamOwnerAccess(TEAM_ID);

    expect(result).toEqual({
      ok: false,
      reason: "not_owner",
    });
  });

  it("团队所有者返回完整成功结果", async () => {
    mockSignedIn();
    mockMembershipRows([
      { id: MEMBERSHIP_ID, role: "owner" },
    ]);

    const result = await getTeamOwnerAccess(TEAM_ID);

    expect(result).toEqual({
      ok: true,
      teamId: TEAM_ID,
      userId: USER_ID,
      membershipId: MEMBERSHIP_ID,
      role: "owner",
    });
  });
});
