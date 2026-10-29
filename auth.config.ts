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
      const isOnAuthPage =
        nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/register";

      if (isOnDashboard) {
        return isLoggedIn;
      }

      if (isLoggedIn && isOnAuthPage) {
        return Response.redirect(
          new URL("/dashboard", nextUrl),
        );
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;