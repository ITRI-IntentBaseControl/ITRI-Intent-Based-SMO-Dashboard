"use client";

import React from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";

// 從自訂 hook 匯入
import { useConversation } from "./hooks/useConversation";

export default function ConversationClient({ conversationId }) {
  const { width } = useWindowSize();
  const { open } = useSidebar();

  // 從 hook 取得對話邏輯
  const {
    isLoading,
    inputValue,
    setInputValue,
    chatMessages,
    typingMessage,
    handleSendMessage,
  } = useConversation(conversationId);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      {/* 頂部 Header */}
      <ConversationHeader />

      {/* 訊息列表 */}
      <ConversationMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
      />

      {/* 輸入區域 */}
      <ConversationInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
