"use client";

import React, { useEffect, useState } from "react";
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

// 下拉選單 (DropdownMenu) 相關組件 (shadcn/ui)
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// 圖示: 使用 lucide-react 提供的鉛筆圖示 Edit3
import { MoreVertical, Trash2, Edit3 } from "lucide-react";

// 從 service.jsx 匯入 API
import {
  getConversationList,
  deleteConversation,
  renameConversation,
} from "./service";

// 若使用 TypeScript，可宣告資料格式 (JS 則可省略)
interface ConversationItem {
  conversation_uid: string;
  conversation_name: string;
  conversation_path: string;
  created_at: string;
  updated_at: string;
  user_uid: string;
}

export function RootSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [conversationList, setConversationList] = useState<ConversationItem[]>(
    []
  );

  useEffect(() => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      router.push("/signin");
      return;
    }

    (async () => {
      try {
        // 呼叫 service.jsx 內的 getConversationList
        const data = await getConversationList(userUid);

        if (data?.status === true && data?.data) {
          setConversationList(data.data);
        } else {
          console.error("Failed to fetch conversation list:", data);
        }
      } catch (error) {
        console.error("API Error:", error);
      }
    })();
  }, [router]);

  // 刪除對話
  const handleDelete = async (conversationUid: string) => {
    try {
      const data = await deleteConversation(conversationUid);
      if (data?.status === true) {
        // 從前端狀態移除
        setConversationList((prev) =>
          prev.filter((item) => item.conversation_uid !== conversationUid)
        );
      } else {
        console.error("Delete conversation failed:", data);
      }
    } catch (error) {
      console.error("Delete conversation API Error:", error);
    }
  };

  // 更改對話名稱
  const handleRename = async (conversation: ConversationItem) => {
    // 簡單示範用 prompt 輸入新名稱，可改成 Modal
    const newName = prompt(
      "請輸入新的對話名稱",
      conversation.conversation_name
    );
    if (!newName || !newName.trim()) return; // 使用者取消或輸入空白不處理

    try {
      const data = await renameConversation(
        conversation.conversation_uid,
        newName
      );
      if (data?.status === true) {
        // 在前端狀態更新名稱
        setConversationList((prev) =>
          prev.map((item) =>
            item.conversation_uid === conversation.conversation_uid
              ? { ...item, conversation_name: newName }
              : item
          )
        );
      } else {
        console.error("Rename conversation failed:", data);
      }
    } catch (error) {
      console.error("Rename conversation API Error:", error);
    }
  };

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

            {/* 右側：New chat 按鈕 */}
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
          {conversationList.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">
              尚無對話紀錄
            </div>
          ) : (
            conversationList.map((conversation) => {
              // 對話名稱過長，做截斷
              const truncatedName =
                conversation.conversation_name.length > 20
                  ? conversation.conversation_name.slice(0, 20) + "..."
                  : conversation.conversation_name;

              return (
                <div
                  key={conversation.conversation_uid}
                  className="flex flex-row items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  {/* 名稱 (點擊可開啟此對話) */}
                  <Link
                    href={`/conversation/${conversation.conversation_uid}`}
                    className="block w-full pr-1"
                    onClick={() => setOpenMobile(false)}
                  >
                    {/* 用 title 屬性保留完整名稱，滑鼠 hover 可查看 */}
                    <span title={conversation.conversation_name}>
                      {truncatedName}
                    </span>
                  </Link>

                  {/* 右側：三個點 (More) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* 更改對話名稱 */}
                      <DropdownMenuItem
                        onClick={() => handleRename(conversation)}
                        className="cursor-pointer"
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        重新命名
                      </DropdownMenuItem>

                      {/* 刪除對話 */}
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onClick={() =>
                          handleDelete(conversation.conversation_uid)
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        刪除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </SidebarMenu>
      </SidebarContent>

      {/* 底部 Footer (可選) */}
      <SidebarFooter>
        <div className="px-2 py-2 text-sm text-muted-foreground">
          可以放使用者資訊或其他功能按鈕
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
