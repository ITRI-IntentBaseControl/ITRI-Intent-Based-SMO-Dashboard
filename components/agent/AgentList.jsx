"use client";

import { AgentItem } from "./AgentItem";
import { useAgentManager } from "@/app/hooks/agent/useAgentManager";

export function AgentList({ onEditAgent, onDeleteAgent }) {
  const { agentList, loading, error } = useAgentManager();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">載入 Agent 列表中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">錯誤: {error}</div>
      </div>
    );
  }

  if (agentList.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">尚無可用的 Agent</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agentList.map((agent) => (
        <AgentItem
          key={agent.agent_uid}
          agent={agent}
          onEditAgent={onEditAgent}
          onDeleteAgent={onDeleteAgent}
        />
      ))}
    </div>
  );
}
