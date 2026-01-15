"use client";

import React, { useState } from "react";
import { ConversationHeader } from "@/components/conversation/ConversationHeader";
import { useRouter } from "next/navigation";
import { AgentItem } from "@/components/agent/AgentItem";
import { CreateAgentDialog } from "@/components/agent/CreateAgentDialog";
import { EditAgentDialog } from "@/components/agent/EditAgentDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  createAgent,
  updateAgent,
  deleteAgent,
} from "@/app/service/agent/ExternalService/agentService";
import { useAgentManager } from "@/app/hooks/agent/useAgentManager";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";

export default function AgentPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { agentList, loading, error, refetchAgents } = useAgentManager();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleCreateAgent = async (agentName, apiKey) => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      toast.error(t("agent.cannot_get_user_id") || "Cannot get user ID");
      return false;
    }

    try {
      const response = await createAgent(userUid, agentName, apiKey);

      if (response?.status_code === 201) {
        toast.success(t("agent.create_success") || "Agent created");
        await refetchAgents();
        setCreateDialogOpen(false);
        return true;
      } else {
        toast.error(
          response?.message || t("agent.create_failed") || "Create Agent failed"
        );
        return false;
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
      toast.error(t("agent.create_failed") || "Create Agent failed");
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
        toast.success(t("agent.update_success") || "Agent updated");
        await refetchAgents();
        return true;
      } else {
        toast.error(
          response?.message || t("agent.update_failed") || "Update Agent failed"
        );
        return false;
      }
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast.error(t("agent.update_failed") || "Update Agent failed");
      return false;
    }
  };

  const handleDeleteAgent = async (agentUid) => {
    try {
      const response = await deleteAgent(agentUid);
      if (response?.status_code === 200) {
        toast.success(t("agent.delete_success") || "Agent deleted");
        await refetchAgents();
        window.dispatchEvent(new Event("updateConversationList"));
        setTimeout(() => {
          window.dispatchEvent(new Event("updateConversationList"));
        }, 1500);
      } else {
        toast.error(
          response?.message || t("agent.delete_failed") || "Delete Agent failed"
        );
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
      toast.error(t("agent.delete_failed") || "Delete Agent failed");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 導航列 */}
      <ConversationHeader />
      <div className="flex-1 flex flex-col gap-4 p-6">
        <div className="flex flex-row gap-2 justify-end items-center mb-2">
          <Button onClick={() => router.push("/agent/management")}>
            {t("agent.management_center") || "Agent Management Center"}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("agent.create")}
          </Button>
        </div>

        {/* Agent List */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">{t("agent.loading")}</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-red-500">
              {t("agent.error_prefix")} {error}
            </div>
          </div>
        ) : agentList.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">{t("agent.no_agents")}</div>
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
    </div>
  );
}
