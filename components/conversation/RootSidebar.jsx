"use client";

import React, { useEffect, useState, useRef } from "react";
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
} from "../../app/service/conversation/ExternalService/apiService";
import { useRenameConversation } from "@/app/hooks/conversation/useRenameConversation";

/**
 * RootSidebar:
 * - 讀取使用者 conversationList 並顯示於側邊欄
 * - 提供新增、重新命名、刪除對話的功能
 */
export function RootSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  // 將 useState 直接使用陣列，不再指定型別
  const [conversationList, setConversationList] = useState([]);

  const {
    editingConversation,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    handleRename,
  } = useRenameConversation(conversationList, setConversationList);

  const fetchConversations = async () => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      router.push("/signin");
      return;
    }
    try {
      const data = await getConversationList(userUid);
      if (data?.status === true && data?.data) {
        setConversationList(data.data);
      } else {
        console.error("Failed to fetch conversation list:", data);
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  // **初始載入時獲取 conversationList**
  useEffect(() => {
    fetchConversations();
  }, []);

  // **監聽 updateConversationList 事件**
  useEffect(() => {
    const handleUpdate = () => {
      fetchConversations();
    };

    window.addEventListener("updateConversationList", handleUpdate);
    return () => {
      window.removeEventListener("updateConversationList", handleUpdate);
    };
  }, []);

  // 刪除對話
  const handleDelete = async (conversationUid) => {
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
                ITRI Intent Based Chatbot
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
                // 注意: 部分版本的 Next 可能不支援 refresh()，
                // 若出現錯誤可移除或改用其他刷新方式
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
                  {editingConversation === conversation.conversation_uid ? (
                    <input
                      type="text"
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRename();
                        }
                      }}
                      onFocus={() =>
                        inputRef.current.setSelectionRange(
                          0,
                          inputRef.current.value.length
                        )
                      }
                      className="border px-2 py-1 rounded-md w-full bg-background"
                    />
                  ) : (
                    <Link
                      href={`/conversation/${conversation.conversation_uid}`}
                      className="block w-full pr-1"
                      onClick={() => setOpenMobile(false)}
                    >
                      <span title={conversation.conversation_name}>
                        {conversation.conversation_name.length > 20
                          ? conversation.conversation_name.slice(0, 20) + "..."
                          : conversation.conversation_name}
                      </span>
                    </Link>
                  )}

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
                        onClick={() => startEditing(conversation)}
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
        <div className="px-2 py-2 text-sm text-muted-foreground"></div>
      </SidebarFooter>
    </Sidebar>
  );
}
