"use client";

import React from "react";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";

// 從自訂 hook 匯入
import { useConversation } from "../../app/hooks/conversation/useConversation";

export default function ConversationClient({ conversationId }) {
  const {
    isLoading,
    inputValue,
    setInputValue,
    chatMessages,
    typingMessage,
    handleSendMessage,
    isSending,
  } = useConversation(conversationId);

  function handleOptionSelect(label) {
    setInputValue((prev) => (prev ? prev + " " + label : label));
  }

  return (
    <div className="flex flex-col min-w-0 h-screen bg-background">
      <ConversationHeader />

      {/* 訊息 + 狀態欄 同一列 */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* 訊息區 */}
        <div className="flex-1 md:flex-row  overflow-y-auto px-2 py-4">
          <div className="mx-auto max-w-3xl flex fle x-col gap-6">
            <ConversationMessages
              chatMessages={chatMessages}
              typingMessage={typingMessage}
              onSelectOption={handleOptionSelect}
              conversationId={conversationId}
            />
          </div>
        </div>
      </div>

      {/* 輸入框 區塊 (置中對齊同 mx-auto max-w-3xl) */}
      <div className="px-2 pb-4">
        <div className="mx-auto max-w-3xl">
          <ConversationInput
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isLoading}
            isSending={isSending}
            conversationId={conversationId}
          />
        </div>
      </div>
    </div>
  );
}
