export const authConfig = {
  pages: {
    signIn: "/signin",
    newUser: "/",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // 1. signin, signup 頁面 - 不需要登入
      const isOnLogin = path.startsWith("/signin");
      const isOnRegister = path.startsWith("/signup");
      if (isOnLogin || isOnRegister) {
        // 如果已經登入了，就重定向到根目錄
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // 2. 只保護 /conversation 路徑
      const isOnConversation = path.startsWith("/conversation");
      if (isOnConversation) {
        if (!isLoggedIn) {
          // 未登入 => 強制導向 /signin
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
