import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/app/lib/project-permissions", () => ({
  getProjectAccess: vi.fn(),
  getProjectAccessFailureMessage: vi.fn(),
}));

vi.mock("@/app/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    batch: vi.fn(),
    execute: vi.fn(),
  },
}));

import { revalidatePath } from "next/cache";
import { db } from "@/app/db";
import {
  getProjectAccess,
  getProjectAccessFailureMessage,
} from "@/app/lib/project-permissions";
import type { ProjectAccessSuccess } from "@/app/lib/project-permissions";
import { createTask } from "@/app/lib/task-actions";
import { activityLogs,projectTasks } from "@/app/db/schema";

const TEAM_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const PROJECT_ID = "d4e5f6a7-8b9c-4d0e-8f1a-2b3c4d5e6f7a";
const USER_ID = "9b2f8c14-6a3d-4e57-8b1a-2c4d6e8f0a1b";
const MEMBERSHIP_ID = "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
const ASSIGNEE_ID = "f7a8b9c0-1d2e-4f3a-9b4c-5d6e7f8a9b0c";

const accessSuccess: ProjectAccessSuccess = {
  ok: true,
  teamId: TEAM_ID,
  userId: USER_ID,
  membershipId: MEMBERSHIP_ID,
  role: "member",
  project: {
    id: PROJECT_ID,
    teamId: TEAM_ID,
    name: "官网改版",
    status: "active",
  },
};

type FormOverrides = {
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
};

function buildFormData(
  overrides: FormOverrides = {},
) {
  const formData = new FormData();

  formData.set(
    "title",
    overrides.title ?? "修复登录页样式",
  );
  formData.set(
    "description",
    overrides.description ?? "调整按钮间距",
  );
  formData.set(
    "assigneeId",
    overrides.assigneeId ?? "",
  );
  formData.set(
    "dueDate",
    overrides.dueDate ?? "",
  );

  return formData;
}

function mockAssigneeRows(rows: Array<{ id: string }>) {
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

  vi.mocked(getProjectAccess).mockResolvedValue(
    accessSuccess,
  );

  vi.mocked(
    getProjectAccessFailureMessage,
  ).mockReturnValue("权限校验失败。");

  vi.mocked(db.insert).mockReturnValue({
    values: () => ({}),
  } as never);

  vi.mocked(db.batch).mockResolvedValue([] as never);
});

describe("createTask", () => {
  it("权限校验失败时直接返回错误消息", async () => {
    vi.mocked(getProjectAccess).mockResolvedValue({
      ok: false,
      reason: "not_member",
    });
    vi.mocked(
      getProjectAccessFailureMessage,
    ).mockReturnValue("你不是该团队的成员。");

    const state = await createTask(
      TEAM_ID,
      PROJECT_ID,
      {},
      buildFormData(),
    );

    expect(state).toEqual({
      success: false,
      message: "你不是该团队的成员。",
    });
    expect(db.batch).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("标题太短时返回字段错误", async () => {
    const state = await createTask(
      TEAM_ID,
      PROJECT_ID,
      {},
      buildFormData({ title: "a" }),
    );

    expect(state.success).toBe(false);
    expect(state.errors?.title).toEqual([
      "任务标题至少需要 2 个字符。",
    ]);
    expect(state.message).toBe(
      "创建任务失败，请检查表单内容。",
    );
    expect(db.batch).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("负责人 ID 格式非法时返回字段错误", async () => {
    const state = await createTask(
      TEAM_ID,
      PROJECT_ID,
      {},
      buildFormData({
        assigneeId: "not-a-uuid",
      }),
    );

    expect(state.errors?.assigneeId).toEqual([
      "负责人 ID 无效。",
    ]);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("负责人不是团队成员时拒绝创建", async () => {
    mockAssigneeRows([]);

    const state = await createTask(
      TEAM_ID,
      PROJECT_ID,
      {},
      buildFormData({
        assigneeId: ASSIGNEE_ID,
      }),
    );

    expect(state).toEqual({
      success: false,
      errors: {
        assigneeId: [
          "所选负责人不是该团队成员。",
        ],
      },
      message: "创建任务失败。",
    });
    expect(db.batch).not.toHaveBeenCalled();
  });

it("表单合法时写入正确的任务和活动日志，并让页面缓存失效", async () => {
  // 分别记录两次 .values() 收到的数据。
  const taskValues = vi.fn().mockReturnValue({
    kind: "task-insert",
  });
  const logValues = vi.fn().mockReturnValue({
    kind: "activity-insert",
  });

  vi.mocked(db.insert)
    .mockReturnValueOnce({
      values: taskValues,
    } as never)
    .mockReturnValueOnce({
      values: logValues,
    } as never);

  const state = await createTask(
    TEAM_ID,
    PROJECT_ID,
    {},
    buildFormData(),
  );

  expect(state).toEqual({
    success: true,
    message: "任务创建成功。",
  });

  // 检查写入的是哪两张表。
  expect(db.insert).toHaveBeenCalledTimes(2);
  expect(db.insert).toHaveBeenNthCalledWith(
    1,
    projectTasks,
  );
  expect(db.insert).toHaveBeenNthCalledWith(
    2,
    activityLogs,
  );

  // 检查任务内容。
  expect(taskValues).toHaveBeenCalledTimes(1);
  expect(taskValues).toHaveBeenCalledWith({
    id: expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
    projectId: PROJECT_ID,
    title: "修复登录页样式",
    description: "调整按钮间距",
    status: "todo",
    assigneeId: null,
    createdBy: USER_ID,
    dueDate: null,
  });

  // 检查活动日志内容。
  expect(logValues).toHaveBeenCalledTimes(1);
  expect(logValues).toHaveBeenCalledWith({
    teamId: TEAM_ID,
    userId: USER_ID,
    action: "task.created",
    details:
      "在项目“官网改版”中创建了任务“修复登录页样式”",
  });

  // 检查两个写入操作被一起交给 batch。
  expect(db.batch).toHaveBeenCalledTimes(1);
  expect(db.batch).toHaveBeenCalledWith([
    { kind: "task-insert" },
    { kind: "activity-insert" },
  ]);

  expect(revalidatePath).toHaveBeenCalledTimes(2);
  expect(revalidatePath).toHaveBeenNthCalledWith(
    1,
    `/dashboard/teams/${TEAM_ID}/projects/${PROJECT_ID}`,
  );
  expect(revalidatePath).toHaveBeenNthCalledWith(
    2,
    `/dashboard/teams/${TEAM_ID}`,
  );
});

  it("数据库写入失败时返回统一错误消息", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(db.batch).mockRejectedValue(
      new Error("连接失败"),
    );

    const state = await createTask(
      TEAM_ID,
      PROJECT_ID,
      {},
      buildFormData(),
    );

    expect(state).toEqual({
      success: false,
      message: "数据库错误：创建任务失败。",
    });
    expect(revalidatePath).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
  it("去除标题首尾空格，并将空白可选字段转换为 null", async () => {
  const taskValues = vi.fn().mockReturnValue({
    kind: "task-insert",
  });

  // 本用例只需要捕获第一次 insert 的任务数据；
  // 第二次日志写入仍使用 beforeEach 的默认模拟。
  vi.mocked(db.insert).mockReturnValueOnce({
    values: taskValues,
  } as never);

  const state = await createTask(
    TEAM_ID,
    PROJECT_ID,
    {},
    buildFormData({
      title: "  修复登录页样式  ",
      description: "   ",
      assigneeId: "",
      dueDate: "",
    }),
  );

  expect(state.success).toBe(true);

  expect(taskValues).toHaveBeenCalledTimes(1);
  expect(taskValues).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "修复登录页样式",
      description: null,
      assigneeId: null,
      dueDate: null,
    }),
  );

  // 未选择负责人，不应额外查询负责人是否属于团队。
  expect(db.select).not.toHaveBeenCalled();
  expect(db.batch).toHaveBeenCalledTimes(1);
});
});
