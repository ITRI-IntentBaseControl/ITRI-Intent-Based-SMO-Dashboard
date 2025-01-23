export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // 1. login, register 頁面 - 不需要登入
      const isOnLogin = path.startsWith("/login");
      const isOnRegister = path.startsWith("/register");
      if (isOnLogin || isOnRegister) {
        // 如果已經登入了，就不應該再留在 login/register 頁
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // 2. 只保護 /chat 路徑
      const isOnChat = path.startsWith("/chat");
      if (isOnChat) {
        if (!isLoggedIn) {
          // 未登入 => 強制導向 /login
          return false;
        }
        // 已登入 => 放行
        return true;
      }

      // 3. 其他路徑 => 不需要登入即可進入
      return true;
    },
  },
} satisfies NextAuthConfig;
