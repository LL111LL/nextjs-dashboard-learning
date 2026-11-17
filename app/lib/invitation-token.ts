import {
  createHash,
  randomBytes,
} from "node:crypto";

// 原始令牌用于邀请链接，不直接存入数据库。
export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

// 数据库只存储令牌的 SHA-256 哈希。
export function hashInvitationToken(
  token: string,
): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}