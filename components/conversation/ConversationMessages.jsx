"use client";

import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

/**
 * Props:
 * - chatMessages: 已完成顯示的訊息 (陣列)
 * - typingMessage: 正在打字中的訊息，可為 null
 *
 * 此元件只負責渲染:
 * - chatMessages: 完整訊息列表
 * - typingMessage: 正在打字的訊息（若有）
 */
export function ConversationMessages({
  chatMessages,
  typingMessage,
  onSelectOption,
}) {
  // 1. 建立 ref，指向可滾動的容器
  const containerRef = useRef(null);

  // 2. 監聽 chatMessages 與 typingMessage，每次更新就捲動到底部
  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [chatMessages, typingMessage]);

  // 3. 自動捲動到底部的函式
  function scrollToBottom() {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  return (
    // 4. 讓 ref 指向可滾動的容器
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 py-4">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* 已完成顯示的訊息 */}
        {chatMessages.map((m) => (
          <MessageBubble
            key={m.id || m.timestamp}
            msg={m}
            onSelectOption={onSelectOption}
          />
        ))}

        {/* 正在打字中的訊息 (typingMessage) */}
        {typingMessage && (
          <MessageBubble
            msg={typingMessage}
            isTyping
            onSelectOption={onSelectOption}
          />
        )}
      </div>
    </div>
  );
}
