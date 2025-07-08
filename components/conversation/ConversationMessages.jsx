// ConversationMessages.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

export function ConversationMessages({
  chatMessages,
  onSelectOption,
  conversationId,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // 只要 chatMessages 陣列長度改變，就滾到底
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  // 判斷最後一筆是否為 user
  const lastMsg = chatMessages[chatMessages.length - 1];
  const shouldShowThinking = lastMsg?.role === "user";

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto px-2 py-4"
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* 先渲染所有聊天訊息，皆以已完成顯示 */}
        {chatMessages.map((m, idx) => (
          <MessageBubble
            key={m.id ?? m.timestamp ?? idx}
            msg={m}
            onSelectOption={onSelectOption}
            conversationId={conversationId}
          />
        ))}

        {/* 如果最後一筆是 user，就顯示一個助理打字中的提示 */}
        {shouldShowThinking && (
          <MessageBubble
            key="thinking"
            msg={{ role: "llm", content: "Thinking…", text_content: [] }}
            isTyping
            onSelectOption={onSelectOption}
            conversationId={conversationId}
          />
        )}

        {/* 滾動目標節點 */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
