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

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { MoreVertical, Trash2, Edit3 } from "lucide-react";

import {
  getConversationList,
  deleteConversation,
} from "../../app/service/conversation/ExternalService/apiService";
import { useRenameConversation } from "@/app/hooks/conversation/useRenameConversation";

export function RootSidebar() {
  const router = useRouter();
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

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const handleUpdate = () => fetchConversations();
    window.addEventListener("updateConversationList", handleUpdate);
    return () =>
      window.removeEventListener("updateConversationList", handleUpdate);
  }, []);

  const handleDelete = async (conversationUid) => {
    try {
      const data = await deleteConversation(conversationUid);
      if (data?.status === true) {
        setConversationList((prev) =>
          prev.filter((c) => c.conversation_uid !== conversationUid)
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
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex justify-between items-center px-2 py-1">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-semibold hover:bg-muted rounded-md px-2">
                ITRI Intent-Based Chatbot
              </span>
            </Link>
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

      <SidebarContent>
        <SidebarMenu>
          {conversationList.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">
              尚無對話紀錄
            </div>
          ) : (
            conversationList.map((conversation) => {
              const name =
                conversation.conversation_name?.trim() || "新對話";
              return (
                <div
                  key={conversation.conversation_uid}
                  className="flex items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  {editingConversation === conversation.conversation_uid ? (
                    <input
                      type="text"
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                      }}
                      onFocus={() =>
                        inputRef.current.setSelectionRange(
                          0,
                          inputRef.current.value.length
                        )
                      }
                      className="flex-1 border bg-background px-2 py-1 rounded-md"
                    />
                  ) : (
                    <Link
                      href={`/conversation/${conversation.conversation_uid}`}
                      onClick={() => setOpenMobile(false)}
                      className="flex-1 pr-1"
                    >
                      <span title={conversation.conversation_name || name}>
                        {name.length > 20 ? name.slice(0, 20) + "..." : name}
                      </span>
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
                        onClick={() => startEditing(conversation)}
                        className="cursor-pointer"
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        重新命名
                      </DropdownMenuItem>
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

      <SidebarFooter>
        <div className="px-2 py-2 text-sm text-muted-foreground" />
      </SidebarFooter>
    </Sidebar>
  );
}
