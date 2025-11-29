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

export function AgentItem({ agent, onEditAgent, onDeleteAgent }) {
  const router = useRouter();
  const [showConversations, setShowConversations] = useState(false);
  const [showNewConvInput, setShowNewConvInput] = useState(false);
  const [newConvMsg, setNewConvMsg] = useState("");
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const {
    conversations,
    loading,
    creating,
    error,
    fetchConversations,
    createConversation,
  } = useAgentConversation(agent.agent_uid);

  // 當展開時獲取對話列表
  useEffect(() => {
    if (showConversations && conversations.length === 0) {
      fetchConversations();
    }
  }, [showConversations, conversations.length, fetchConversations]);

  // 監聽全域對話列表更新事件（例如在側邊欄刪除或新增對話後）
  useEffect(() => {
    const EVENT_NAME = "updateConversationList";
    const handler = () => {
      // 只有展開狀態下才重新抓，避免一次更新觸發所有 Agent 不必要的請求
      if (showConversations) {
        fetchConversations();
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [showConversations, fetchConversations]);

  // 處理創建新對話
  // 新對話送出
  const handleCreateConversation = async () => {
    if (!newConvMsg.trim()) return;
    setIsCreatingConv(true);
    try {
      // 跳轉到首頁，帶上 agent_uid 和訊息
      const params = new URLSearchParams({
        agent_uid: agent.agent_uid,
        msg: newConvMsg,
      });
      router.push(`/?${params.toString()}`);
    } catch (err) {
      alert("建立對話失敗，請稍後再試。");
      setIsCreatingConv(false);
    }
  };

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
              onClick={() => setShowNewConvInput(true)}
              disabled={creating}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              新對話
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
                  <Edit3 className="h-4 w-4" /> 編輯
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="cursor-pointer text-destructive flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> 刪除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {(showNewConvInput || showConversations) && (
        <CardContent>
          {/* 新對話輸入框 */}
          {showNewConvInput && (
            <div className="flex flex-col gap-2 mb-4 pb-4 border-b">
              <textarea
                value={newConvMsg}
                onChange={(e) => setNewConvMsg(e.target.value)}
                placeholder="請輸入訊息..."
                className="border rounded-md px-2 py-1 bg-background min-h-[80px]"
                disabled={isCreatingConv}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateConversation();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewConvInput(false)}
                  disabled={isCreatingConv}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateConversation}
                  disabled={isCreatingConv || !newConvMsg.trim()}
                  className="flex-1"
                >
                  {isCreatingConv ? "建立中..." : "送出"}
                </Button>
              </div>
            </div>
          )}

          {showConversations && (
            <>
              {loading ? (
                <div className="text-gray-500 text-sm py-2">
                  載入對話列表中...
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm py-2">{error}</div>
              ) : conversations.length === 0 ? (
                <div className="text-gray-500 text-sm py-2">
                  尚無對話，點擊「新對話」創建第一個對話
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
                          {conv.conversation_name || "未命名對話"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      )}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除 Agent</DialogTitle>
            <DialogDescription>
              刪除 Agent 會導致所有相關的 Conversation
              也一併刪除，是否確定要刪除？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={confirmingDelete}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={confirmingDelete}
            >
              {confirmingDelete ? "刪除中..." : "確定刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
