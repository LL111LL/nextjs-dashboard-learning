import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnDashboard =
        nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        return isLoggedIn;
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(
          new URL("/dashboard", nextUrl),
        );
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;