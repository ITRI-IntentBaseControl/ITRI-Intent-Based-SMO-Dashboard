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

export function AgentItem({ agent, onEditAgent, onDeleteAgent }) {
  const router = useRouter();
  const [showConversations, setShowConversations] = useState(false);
  const [showNewConvInput, setShowNewConvInput] = useState(false);
  const [newConvMsg, setNewConvMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const { conversations, loading, error, fetchConversations } =
    useAgentConversation(agent.agent_uid);

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

  // 處理創建新對話 - 帶訊息創建對話並導航
  const handleCreateConversation = async () => {
    if (!newConvMsg.trim()) return;

    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      alert("無法取得使用者ID，請確認 localStorage 是否已儲存 user_uid。");
      return;
    }

    setIsCreatingConv(true);
    try {
      // 呼叫後端 API 建立新的對話（帶上 agent_uid）
      const data = await createConversation(userUid, agent.agent_uid);

      // 從後端回傳資料中取得 conversation_uid
      const conversation_uid = data?.data?.conversation_uid;

      if (!conversation_uid) {
        throw new Error("無法取得對話ID");
      }

      // 將使用者輸入的訊息暫存到 localStorage
      localStorage.setItem(`init_msg_${conversation_uid}`, newConvMsg);

      // 觸發 updateConversationList，通知 RootSidebar 更新
      window.dispatchEvent(new Event("updateConversationList"));

      // 重置輸入框狀態
      setShowNewConvInput(false);
      setNewConvMsg("");

      // 導航頁面到 /conversation/[conversation_uid]
      router.push(`/conversation/${conversation_uid}`);

      // 延遲再次觸發 updateConversationList，確保後端資料一致後刷新
      setTimeout(() => {
        window.dispatchEvent(new Event("updateConversationList"));
      }, 3000);
    } catch (err) {
      console.error("Create conversation error:", err);
      alert("建立對話失敗，請稍後再試。");
    } finally {
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
              disabled={isCreatingConv}
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
                  onClick={() => {
                    setShowNewConvInput(false);
                    setNewConvMsg("");
                  }}
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
