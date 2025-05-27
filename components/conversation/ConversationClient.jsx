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

  const {
    isLoading,
    inputValue,
    setInputValue,
    chatMessages,
    typingMessage,
    handleSendMessage,
  } = useConversation(conversationId);
  console.log(typingMessage)
  // ❶ 只要 typingMessage.content 有字就鎖定輸入
  const isInputDisabled = Boolean(typingMessage?.content?.trim());

  function handleOptionSelect(label) {
    setInputValue(prev => (prev ? prev + " " + label : label));
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ConversationHeader />

      <ConversationMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
        onSelectOption={handleOptionSelect}
      />

      <StatusColumn side="right" />

      {/* ❷ 傳入 isDisabled */}
      <ConversationInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
        isDisabled={isInputDisabled}
      />
    </div>
  );
}