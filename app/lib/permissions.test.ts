import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

// 权限模块会导入 db 和 auth。
// 这组测试只测试纯消息转换，因此把外部依赖替换为空 mock。
vi.mock("@/app/db", () => ({
  db: {},
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import {
  getTeamAccessFailureMessage,
  type TeamAccessFailureReason,
} from "@/app/lib/team-permissions";

import {
  getProjectAccessFailureMessage,
  type ProjectAccessFailureReason,
} from "@/app/lib/project-permissions";

describe("getTeamAccessFailureMessage", () => {
  const cases: Array<{
    reason: TeamAccessFailureReason;
    expected: string;
  }> = [
    {
      reason: "invalid_team_id",
      expected: "团队 ID 无效。",
    },
    {
      reason: "unauthenticated",
      expected: "登录状态已失效，请重新登录。",
    },
    {
      reason: "not_member",
      expected: "你不是该团队的成员。",
    },
    {
      reason: "not_owner",
      expected: "只有团队所有者可以执行此操作。",
    },
  ];

  it.each(cases)(
    "$reason → $expected",
    ({ reason, expected }) => {
      expect(
        getTeamAccessFailureMessage(reason),
      ).toBe(expected);
    },
  );
});

describe("getProjectAccessFailureMessage", () => {
  const cases: Array<{
    reason: ProjectAccessFailureReason;
    expected: string;
  }> = [
    {
      reason: "invalid_project_id",
      expected: "项目 ID 无效。",
    },
    {
      reason: "project_not_found",
      expected: "找不到该团队项目。",
    },
    {
      reason: "not_member",
      expected: "你不是该团队的成员。",
    },
    {
      reason: "unauthenticated",
      expected: "登录状态已失效，请重新登录。",
    },
  ];

  it.each(cases)(
    "$reason → $expected",
    ({ reason, expected }) => {
      expect(
        getProjectAccessFailureMessage(reason),
      ).toBe(expected);
    },
  );
});