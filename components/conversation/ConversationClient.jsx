"use client";

import React from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { StatusColumn } from "@/components/conversation/StatusColumn";

// 從自訂 hook 匯入
import { useConversation } from "../../app/hooks/conversation/useConversation";

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

  //按下option後讓文字進到使用者輸入框
  function handleOptionSelect(label) {
    //不覆蓋使用者原先輸入的資訊
    setInputValue((prev) => (prev ? prev + " " + label : label));
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      {/* 頂部 Header */}
      <ConversationHeader />

      {/* 訊息列表 */}
      <ConversationMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
        onSelectOption={handleOptionSelect}
      />

      <StatusColumn side="right" />

      <ConversationInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
