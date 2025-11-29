// components/sidebar/RootSidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { MoreVertical, Trash2, Edit3, LogOut, Download } from "lucide-react";
import { ExportConversationDialog } from "@/components/conversation/ExportConversationDialog";

import { useConversationManager } from "@/app/hooks/conversation/useConversationManager";
import { usePathname } from "next/navigation";

export function RootSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const {
    conversationList,
    handleDelete,
    editingConversation,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    handleRename,
  } = useConversationManager();

  // logout handler
  const handleLogout = () => {
    localStorage.removeItem("user_uid");
    router.push("/signin");
  };

  // 匯出對話相關狀態
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportingConversation, setExportingConversation] =
    React.useState(null);

  // 開啟匯出對話框
  const openExportDialog = (conversation) => {
    setExportingConversation(conversation);
    setExportDialogOpen(true);
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="px-2 py-1">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="text-lg font-semibold hover:bg-muted rounded-md px-2 block"
            >
              ITRI Intent-Based Chatbot
            </Link>
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
                  className={`flex items-center px-2 py-1 rounded-md transition-colors ${
                    pathname === `/conversation/${c.conversation_uid}`
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
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
                        onClick={() => openExportDialog(c)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" /> 匯出
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

      {/* 匯出對話對話框 */}
      <ExportConversationDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        conversation={exportingConversation}
      />
    </Sidebar>
  );
}
