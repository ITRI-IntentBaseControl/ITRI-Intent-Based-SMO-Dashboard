"use client";

import React, { useState } from "react";
import { AgentItem } from "@/components/agent/AgentItem";
import { ConversationHeader } from "@/components/conversation/ConversationHeader";
import { CreateAgentDialog } from "@/components/agent/CreateAgentDialog";
import { EditAgentDialog } from "@/components/agent/EditAgentDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createAgent,
  updateAgent,
  deleteAgent,
} from "@/app/service/agent/ExternalService/agentService";
import { useAgentManager } from "@/app/hooks/agent/useAgentManager";
import { toast } from "sonner";

export default function AgentSelectPage() {
  const router = useRouter();
  const { agentList, loading, error, refetchAgents } = useAgentManager();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleCreateAgent = async (agentName, apiKey) => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      toast.error("無法取得使用者ID");
      return false;
    }

    try {
      const response = await createAgent(userUid, agentName, apiKey);

      if (response?.status_code === 201) {
        toast.success("成功創建 agent");

        // 強制重新呼叫 get_agent_list_metadata API
        await refetchAgents();

        // 關閉對話框
        setCreateDialogOpen(false);

        return true;
      } else {
        toast.error(response?.message || "創建 Agent 失敗");
        return false;
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
      toast.error("創建 Agent 失敗");
      return false;
    }
  };

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };

  const handleUpdateAgent = async (agentUid, agentName, apiKey) => {
    try {
      const response = await updateAgent(agentUid, agentName, apiKey);
      if (response?.status_code === 200) {
        toast.success("成功更新 agent");

        // 重新獲取 agent 列表
        await refetchAgents();

        // 返回成功，讓子組件關閉對話框
        return true;
      } else {
        toast.error(response?.message || "更新 Agent 失敗");
        return false;
      }
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast.error("更新 Agent 失敗");
      return false;
    }
  };

  const handleDeleteAgent = async (agentUid) => {
    try {
      const response = await deleteAgent(agentUid);
      if (response?.status_code === 200) {
        toast.success("成功刪除 agent");
        // 重新獲取 agent 列表
        await refetchAgents();
        // 更新側邊欄的對話列表（因為相關對話已被刪除）
        window.dispatchEvent(new Event("updateConversationList"));
        // 再次延遲觸發，確保後端資料一致後刷新
        setTimeout(() => {
          window.dispatchEvent(new Event("updateConversationList"));
        }, 1500);
      } else {
        toast.error(response?.message || "刪除 Agent 失敗");
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
      toast.error("刪除 Agent 失敗");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <ConversationHeader title="Agent Select" />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">選擇 Agent</h1>
              <p className="text-gray-600 dark:text-gray-400">
                選擇一個 Agent 來查看對話或創建新對話
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              創建 Agent
            </Button>
          </div>

          {/* Agent List */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">載入 Agent 列表中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-red-500">錯誤: {error}</div>
            </div>
          ) : agentList.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">尚無可用的 Agent</div>
            </div>
          ) : (
            <div className="space-y-4">
              {agentList.map((agent) => (
                <AgentItem
                  key={agent.agent_uid}
                  agent={agent}
                  onEditAgent={handleEditAgent}
                  onDeleteAgent={handleDeleteAgent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateAgentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateSuccess={handleCreateAgent}
      />
      <EditAgentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        agent={selectedAgent}
        onUpdateSuccess={handleUpdateAgent}
      />
    </div>
  );
}
