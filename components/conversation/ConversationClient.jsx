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
    setChatMessages,
    typingMessage,
    handleSendMessage,
    isSending,
    retryCountMap,
    setRetryCountMap,
  } = useConversation(conversationId);

  function handleOptionSelect(label) {
    setInputValue((prev) => (prev ? prev + " " + label : label));
  }

  // 當 reward 更新成功時，更新 chatMessages 中對應訊息的 reward
  function handleRewardChange(messageIndex, newReward) {
    setChatMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, reward: newReward } : msg
      )
    );
  }

  // 重新生成：取最後一則 user 訊息重送，並增加 retry 次數
  React.useEffect(() => {
    const handler = () => {
      if (isSending) {
        return;
      }
      // 找到最後一則 user 訊息的索引
      let lastUserIndex = -1;
      for (let i = chatMessages.length - 1; i >= 0; i--) {
        if (chatMessages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }
      if (lastUserIndex >= 0) {
        const userMsg = chatMessages[lastUserIndex];
        // 將字串 retry 轉為數字進行計算
        const currentRetry = parseInt(userMsg.retry || "0", 10);
        const nextRetry = currentRetry + 1;
        // 轉回字串格式
        const nextRetryStr = String(nextRetry);

        // 更新該 user 訊息的 retry 值（字串格式）
        setChatMessages((prev) =>
          prev.map((msg, idx) =>
            idx === lastUserIndex ? { ...msg, retry: nextRetryStr } : msg
          )
        );

        // 重新發送訊息，帶上新的 retry 次數（字串格式，但不添加新的 user 訊息）
        handleSendMessage(userMsg.content, nextRetryStr, true);
      }
    };
    window.addEventListener("conversation:regenerate", handler);
    return () => window.removeEventListener("conversation:regenerate", handler);
  }, [chatMessages, handleSendMessage, isSending]);

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
              isSending={isSending}
              onRewardChange={handleRewardChange}
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
