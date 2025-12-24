"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  MoreVertical,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAgentConversation } from "@/app/hooks/agent/useAgentConversation";
import { createConversation } from "@/app/service/conversation/ExternalService/apiService";
import { useLocale } from "@/components/LocaleProvider";

export function AgentItem({ agent, onEditAgent, onDeleteAgent }) {
  const router = useRouter();
  const [showConversations, setShowConversations] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const { conversations, loading, error, fetchConversations } =
    useAgentConversation(agent.agent_uid);
  const { t } = useLocale();

  // 當展開時獲取對話列表
  useEffect(() => {
    if (showConversations && conversations.length === 0) {
      fetchConversations();
    }
  }, [showConversations, conversations.length, fetchConversations]);

  // 監聯全域對話列表更新事件（例如在側邊欄刪除或新增對話後）
  useEffect(() => {
    const EVENT_NAME = "updateConversationList";
    const handler = () => {
      // 只有展開狀態下才重新抓，避免一次更新觸發所有 Agent 不必要的請求
      // 使用靜默更新（silent=true），不顯示 loading 狀態，避免閃爍
      if (showConversations) {
        fetchConversations(true);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [showConversations, fetchConversations]);

  // 處理點擊對話項目
  const handleConversationClick = (conversationUid) => {
    router.push(`/conversation/${conversationUid}`);
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      await onDeleteAgent(agent.agent_uid);
      setShowDeleteConfirm(false);
    } catch (e) {
      // errors are handled by parent toast
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
          >
            {showConversations ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <CardTitle className="text-lg font-semibold">
              {agent.agent_name}
            </CardTitle>
          </button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                localStorage.setItem('selected_agent_uid', agent.agent_uid);
                router.push('/');
              }}
              disabled={isCreatingConv}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("conversation.new_button")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEditAgent(agent)}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" /> {t("agent.update_title")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="cursor-pointer text-destructive flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> {t("sidebar.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {showConversations && (
        <CardContent>
          {loading ? (
            <div className="text-gray-500 text-sm py-2">
              {t("conversation.loading")}
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-2">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="text-gray-500 text-sm py-2">
              {t("conversation.no_conversations_hint")}
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conv) => (
                <li key={conv.conversation_uid}>
                  <button
                    onClick={() =>
                      handleConversationClick(conv.conversation_uid)
                    }
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {conv.conversation_name || t("conversation.unnamed")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("conversation.confirm_delete_agent_title")}
            </DialogTitle>
            <DialogDescription>
              {t("conversation.confirm_delete_agent_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={confirmingDelete}
            >
              {t("agent.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={confirmingDelete}
            >
              {confirmingDelete
                ? t("conversation.deleting")
                : t("conversation.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
