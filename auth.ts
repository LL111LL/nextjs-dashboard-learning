import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { neon } from "@neondatabase/serverless";
import { compare } from "bcryptjs";
import { z } from "zod";

import { authConfig } from "./auth.config";

type DatabaseUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

async function getUser(
  email: string,
): Promise<DatabaseUser | undefined> {
  if (!process.env.DATABASE_URL) {
    throw new Error("缺少 DATABASE_URL");
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const users = await sql`
      SELECT id, name, email, password
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    return users[0] as DatabaseUser | undefined;
  } catch (error) {
    console.error("查询登录用户失败：", error);
    throw new Error("查询登录用户失败");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
   callbacks: {
    ...authConfig.callbacks,

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } =
          parsedCredentials.data;
        const user = await getUser(email);

        if (!user) {
          return null;
        }

        const passwordsMatch = await compare(
          password,
          user.password,
        );

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});