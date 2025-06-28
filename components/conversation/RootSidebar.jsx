// components/sidebar/RootSidebar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit3, LogOut } from "lucide-react";

import {
  getConversationList,
  deleteConversation,
} from "@/app/service/conversation/ExternalService/apiService";
import { useRenameConversation } from "@/app/hooks/conversation/useRenameConversation";

export function RootSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [conversationList, setConversationList] = useState([]);

  const {
    editingConversation,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    handleRename,
  } = useRenameConversation(conversationList, setConversationList);

  // fetch list
  const fetchConversations = async () => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      router.push("/signin");
      return;
    }
    try {
      const data = await getConversationList(userUid);
      if (data?.status && data.data) {
        setConversationList(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const onUpdate = () => fetchConversations();
    window.addEventListener("updateConversationList", onUpdate);
    return () => window.removeEventListener("updateConversationList", onUpdate);
  }, []);

  // delete conversation
  const handleDelete = async (conversationUid) => {
    try {
      const res = await deleteConversation(conversationUid);
      if (res?.status) {
        setConversationList((prev) =>
          prev.filter((c) => c.conversation_uid !== conversationUid)
        );
        if (pathname === `/conversation/${conversationUid}`) {
          router.push("/");
        }
        window.dispatchEvent(new Event("updateConversationList"));
        setOpenMobile(false);
      } else {
        console.error("刪除對話失敗", res);
      }
    } catch (err) {
      console.error("刪除對話出錯", err);
    }
  };

  // logout handler
  const handleLogout = () => {
    localStorage.removeItem("user_uid");
    router.push("/signin");
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex justify-between items-center px-2 py-1">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="text-lg font-semibold hover:bg-muted rounded-md px-2"
            >
              ITRI Intent-Based Chatbot
            </Link>
            <Button
              variant="ghost"
              className="p-2"
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

      <SidebarContent>
        <SidebarMenu>
          {conversationList.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">
              尚無對話紀錄
            </div>
          ) : (
            conversationList.map((c) => {
              const name = c.conversation_name || "新對話";
              const truncated =
                name.length > 20 ? name.slice(0, 20) + "..." : name;
              return (
                <div
                  key={c.conversation_uid}
                  className="flex items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  {editingConversation === c.conversation_uid ? (
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                      }}
                      className="flex-1 border px-2 py-1 rounded-md bg-background"
                    />
                  ) : (
                    <Link
                      href={`/conversation/${c.conversation_uid}`}
                      onClick={() => setOpenMobile(false)}
                      className="flex-1 pr-2"
                    >
                      <span title={name}>{truncated}</span>
                    </Link>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => startEditing(c)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" /> 重新命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(c.conversation_uid)}
                        className="cursor-pointer text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" /> 刪除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 px-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> 登出
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
