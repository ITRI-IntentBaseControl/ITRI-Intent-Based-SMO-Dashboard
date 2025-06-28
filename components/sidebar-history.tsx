// SidebarHistory.tsx
"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { useChatVisibility } from "@/hooks/use-chat-visibility";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const PureChatItem = ({
  chat,
  isActive,
  onRequestDelete,
  setOpenMobile,
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => setVisibilityType("private")}
                  className="flex justify-between"
                >
                  <div className="flex items-center gap-2">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === "private" && (
                    <CheckCircleFillIcon />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setVisibilityType("public")}
                  className="flex justify-between"
                >
                  <div className="flex items-center gap-2">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" && <CheckCircleFillIcon />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* 這裡把刪除按鈕包在 AlertDialogTrigger */}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive cursor-pointer">
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(
  PureChatItem,
  (prev, next) => prev.isActive === next.isActive
);

export function SidebarHistory({ user }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const { data: history = [], isLoading, mutate } = useSWR(
    user ? "/api/history" : null,
    fetcher
  );

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const [toDeleteId, setToDeleteId] = useState(null);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    const promise = fetch(`/api/chat?id=${toDeleteId}`, { method: "DELETE" });
    toast.promise(promise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((chats) => chats?.filter((c) => c.id !== toDeleteId) ?? []);
        return "Chat deleted";
      },
      error: "Failed to delete chat",
    });
    setOpen(false);
    if (toDeleteId === id) router.push("/");
  };

  const groupChatsByDate = (chats) => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);
    return chats.reduce(
      (groups, chat) => {
        const d = new Date(chat.createdAt);
        if (isToday(d)) groups.today.push(chat);
        else if (isYesterday(d)) groups.yesterday.push(chat);
        else if (d > oneWeekAgo) groups.lastWeek.push(chat);
        else if (d > oneMonthAgo) groups.lastMonth.push(chat);
        else groups.older.push(chat);
        return groups;
      },
      { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] }
    );
  };

  if (isLoading) {
    return <div className="px-4 py-2">Loading…</div>;
  }
  if (!history.length) {
    return <div className="px-4 py-2 text-zinc-500">No chats yet.</div>;
  }

  const grouped = groupChatsByDate(history);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {Object.entries(grouped).map(([section, chats]) =>
              chats.length ? (
                <div key={section}>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    {section === "today"
                      ? "Today"
                      : section === "yesterday"
                      ? "Yesterday"
                      : section === "lastWeek"
                      ? "Last 7 days"
                      : section === "lastMonth"
                      ? "Last 30 days"
                      : "Older"}
                  </div>
                  {chats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onRequestDelete={(cid) => {
                        setToDeleteId(cid);
                        setOpen(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              ) : null
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
