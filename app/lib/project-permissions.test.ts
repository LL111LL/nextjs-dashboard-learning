import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/app/lib/team-permissions", () => ({
  getTeamAccess: vi.fn(),
  // project-permissions 还 import 了这个函数，
  // Mock 工厂必须一并导出，否则模块加载会报缺导出。
  getTeamAccessFailureMessage: vi.fn(),
}));

vi.mock("@/app/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/app/db";
import { getProjectAccess } from "@/app/lib/project-permissions";
import type { TeamAccessSuccess } from "@/app/lib/team-permissions";
import { getTeamAccess } from "@/app/lib/team-permissions";

const TEAM_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const USER_ID = "9b2f8c14-6a3d-4e57-8b1a-2c4d6e8f0a1b";
const MEMBERSHIP_ID = "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
const PROJECT_ID = "d4e5f6a7-8b9c-4d0e-8f1a-2b3c4d5e6f7a";

const teamAccess: TeamAccessSuccess = {
  ok: true,
  teamId: TEAM_ID,
  userId: USER_ID,
  membershipId: MEMBERSHIP_ID,
  role: "member",
};

const projectRow = {
  id: PROJECT_ID,
  teamId: TEAM_ID,
  name: "官网改版",
  status: "active",
};

type ProjectRow = typeof projectRow;

function mockProjectRows(rows: ProjectRow[]) {
  vi.mocked(db.select).mockReturnValue({
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getProjectAccess", () => {
  it("团队校验失败时原样返回团队的错误原因", async () => {
    vi.mocked(getTeamAccess).mockResolvedValue({
      ok: false,
      reason: "not_member",
    });

    const result = await getProjectAccess(
      TEAM_ID,
      PROJECT_ID,
    );

    expect(result).toEqual({
      ok: false,
      reason: "not_member",
    });
    expect(db.select).not.toHaveBeenCalled();
  });

  it("projectId 不是合法 UUID 时返回 invalid_project_id", async () => {
    vi.mocked(getTeamAccess).mockResolvedValue(teamAccess);

    const result = await getProjectAccess(
      TEAM_ID,
      "not-a-uuid",
    );

    expect(result).toEqual({
      ok: false,
      reason: "invalid_project_id",
    });
    expect(db.select).not.toHaveBeenCalled();
  });

  it("项目不存在或不属于该团队时返回 project_not_found", async () => {
    vi.mocked(getTeamAccess).mockResolvedValue(teamAccess);
    mockProjectRows([]);

    const result = await getProjectAccess(
      TEAM_ID,
      PROJECT_ID,
    );

    expect(result).toEqual({
      ok: false,
      reason: "project_not_found",
    });
  });

  it("项目属于该团队时返回团队信息与项目信息", async () => {
    vi.mocked(getTeamAccess).mockResolvedValue(teamAccess);
    mockProjectRows([projectRow]);

    const result = await getProjectAccess(
      TEAM_ID,
      PROJECT_ID,
    );

    expect(result).toEqual({
      ...teamAccess,
      project: projectRow,
    });
  });
});
