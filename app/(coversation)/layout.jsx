import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RootSidebar } from "@/app/(coversation)/RootSidebar";
import { auth } from "../(auth)/auth";
import Script from "next/script";

// 在部分 Next.js 版本下，此屬性可用於實驗功能
export const experimental_ppr = true;

// 移除 TypeScript 型別 (React.ReactNode) 改為單純解構 children
export default async function Layout({ children }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <RootSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
