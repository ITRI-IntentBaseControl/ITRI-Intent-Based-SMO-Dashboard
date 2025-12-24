"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConversationHeader } from "@/components/conversation/ConversationHeader";
import { ConversationInput } from "@/components/conversation/ConversationInput";
import { createConversation } from "@/app/service/conversation/ExternalService/apiService";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [preSelectedAgentUid, setPreSelectedAgentUid] = useState(null);

  // Auto-select agent from localStorage
  useEffect(() => {
    const agentUid = localStorage.getItem("selected_agent_uid");
    if (agentUid) {
      setPreSelectedAgentUid(agentUid);
      localStorage.removeItem("selected_agent_uid");
    }
  }, []);

  const handleSendMessage = async (message) => {
    if (!selectedAgent) return;

    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      toast.error(t("agent.cannot_get_user_id"));
      return;
    }

    setIsCreating(true);
    try {
      const data = await createConversation(userUid, selectedAgent.agent_uid);
      const conversationUid = data?.data?.conversation_uid;
      if (conversationUid) {
        // 將初始訊息暫存到 localStorage
        if (message && message.trim()) {
          localStorage.setItem(`init_msg_${conversationUid}`, message);
        }
        // 通知側邊欄刷新
        window.dispatchEvent(new Event("updateConversationList"));
        router.push(`/conversation/${conversationUid}`);
        // 10秒後再刷新一次，確保標題已被後端更新
        setTimeout(() => {
          window.dispatchEvent(new Event("updateConversationList"));
        }, 1500);
      } else {
        throw new Error("No conversation UID returned");
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to create conversation");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <ConversationHeader
        title={t("conversation.new_conversation") || "New Conversation"}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <ConversationInput
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isCreating}
            showAgentSelect={true}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            preSelectedAgentUid={preSelectedAgentUid}
          />
        </div>
      </div>
    </div>
  );
}
