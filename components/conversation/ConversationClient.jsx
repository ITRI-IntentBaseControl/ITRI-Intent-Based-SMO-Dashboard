// ConversationClient.tsx
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

  // 只要 typingMessage.content 有字就鎖定輸入
  const isInputDisabled = Boolean(typingMessage?.content?.trim());

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
            />
          </div>
        </div>

        {/* 右側狀態欄 */}
        {open && <StatusColumn side="right" />}
      </div>

      {/* 輸入框 區塊 (置中對齊同 mx-auto max-w-3xl) */}
      <div className="px-2 pb-4">
        <div className="mx-auto max-w-3xl">
          <ConversationInput
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isLoading}
            isDisabled={isInputDisabled}
          />
        </div>
      </div>
    </div>
  );
}
