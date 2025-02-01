"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * 這裡示範幾筆「假資料」，可自由增加或調整。
 */
const FAKE_CHATS = [
  { id: "dummy-1", title: "Welcome Chat" },
  { id: "dummy-2", title: "How to use ChatBot" },
  { id: "dummy-3", title: "Favorite Topics" },
];

export function RootSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      {/* 頂部 Header */}
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            {/* 左側標題: 點擊回到 / */}
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                ITRI Intent Base Chatbot
              </span>
            </Link>

            {/* 右側：New Chat 按鈕 */}
            <Button
              variant="ghost"
              type="button"
              className="p-2 h-fit"
              onClick={() => {
                setOpenMobile(false);
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
            </Button>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      {/* 中間 Content */}
      <SidebarContent>
        <SidebarMenu>
          {/* 假資料清單 */}
          {FAKE_CHATS.map((chat) => (
            <div
              key={chat.id}
              className="flex flex-row items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
            >
              <Link
                href="/"
                className="block w-full"
                onClick={() => setOpenMobile(false)}
              >
                {chat.title}
              </Link>
            </div>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* 底部 Footer (可選) */}
      <SidebarFooter>
        <div className="px-2 py-2 text-sm text-muted-foreground">
          {/* 可以放你的使用者資訊或其他功能按鈕 */}
          Fake Sidebar
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
