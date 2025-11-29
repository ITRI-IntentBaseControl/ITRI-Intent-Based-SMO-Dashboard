import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RootSidebar } from "@/components/conversation/RootSidebar";
import { auth } from "../(auth)/auth";

// 在部分 Next.js 版本下，此屬性可用於實驗功能
export const experimental_ppr = true;

// Agent 路由的 Layout
export default async function AgentLayout({ children }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <RootSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
