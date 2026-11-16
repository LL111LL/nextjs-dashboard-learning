import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/app/db";
import { projects } from "@/app/db/schema";
import {
  getTeamAccess,
  getTeamAccessFailureMessage,
  type TeamAccessFailureReason,
  type TeamAccessSuccess,
} from "@/app/lib/team-permissions";

export type ProjectAccessFailureReason =
  | TeamAccessFailureReason
  | "invalid_project_id"
  | "project_not_found";

export type ProjectAccessSuccess =
  TeamAccessSuccess & {
    project: {
      id: string;
      teamId: string;
      name: string;
      status: string;
    };
  };

export type ProjectAccessFailure = {
  ok: false;
  reason: ProjectAccessFailureReason;
};

export type ProjectAccessResult =
  | ProjectAccessSuccess
  | ProjectAccessFailure;

/**
 * 检查：
 * 1. 当前用户是否属于团队；
 * 2. projectId 是否有效；
 * 3. 项目是否属于该团队。
 */
export async function getProjectAccess(
  teamId: string,
  projectId: string,
): Promise<ProjectAccessResult> {
  const teamAccess =
    await getTeamAccess(teamId);

  if (!teamAccess.ok) {
    return teamAccess;
  }

  const projectIdResult = z
    .string()
    .uuid()
    .safeParse(projectId);

  if (!projectIdResult.success) {
    return {
      ok: false,
      reason: "invalid_project_id",
    };
  }

  const validProjectId = projectIdResult.data;

  const [project] = await db
    .select({
      id: projects.id,
      teamId: projects.teamId,
      name: projects.name,
      status: projects.status,
    })
    .from(projects)
    .where(
      and(
        eq(projects.id, validProjectId),
        eq(
          projects.teamId,
          teamAccess.teamId,
        ),
      ),
    )
    .limit(1);

  if (!project) {
    return {
      ok: false,
      reason: "project_not_found",
    };
  }

  return {
    ...teamAccess,
    project,
  };
}

export function getProjectAccessFailureMessage(
  reason: ProjectAccessFailureReason,
): string {
  switch (reason) {
    case "invalid_project_id":
      return "项目 ID 无效。";

    case "project_not_found":
      return "找不到该团队项目。";

    case "invalid_team_id":
    case "unauthenticated":
    case "not_member":
    case "not_owner":
      return getTeamAccessFailureMessage(reason);
  }
}