"use client";

import React, { useEffect, useRef } from "react";
import { TestMessageBubble } from "./TestMessageBubble";

/**
 * Props:
 * - chatMessages: 已完成顯示的訊息 (陣列)
 * - typingMessage: 正在打字中的訊息，可為 null
 *
 * 此元件只負責渲染:
 * - chatMessages: 完整訊息列表
 * - typingMessage: 正在打字的訊息（若有）
 */
export default function TestMessages({
  chatMessages,
  typingMessage,
  onSelectOption,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, typingMessage]);

  function scrollToBottom() {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 py-4">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* 已完成顯示的訊息 */}
        {chatMessages.map((m, i) => (
          <TestMessageBubble key={i} msg={m} onSelectOption={onSelectOption} />
        ))}

        {/* 正在打字中的訊息 (typingMessage) */}
        {typingMessage && (
          <TestMessageBubble
            msg={typingMessage}
            isTyping
            onSelectOption={onSelectOption}
          />
        )}
      </div>
    </div>
  );
}
