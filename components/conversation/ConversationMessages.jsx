// ConversationMessages.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

export function ConversationMessages({
  chatMessages,
  typingMessage,
  onSelectOption,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // 當有新訊息或 typingMessage 變化時，滾動到 bottomRef
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, typingMessage?.content]);

  return (
    <div
      ref={containerRef}
      // **重點：加上 min-h-0，才能正確讓 overflow-y-auto 生效**
      className="min-h-0 flex-1 overflow-y-auto px-2 py-4"
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {chatMessages.map((m, index) => (
          <MessageBubble
            key={m.id ?? m.timestamp ?? index}
            msg={m}
            onSelectOption={onSelectOption}
          />
        ))}

        {typingMessage && (
          <MessageBubble
            key="typing"
            msg={typingMessage}
            isTyping
            onSelectOption={onSelectOption}
          />
        )}

        {/* 空的 div 作為滾動目標 */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
