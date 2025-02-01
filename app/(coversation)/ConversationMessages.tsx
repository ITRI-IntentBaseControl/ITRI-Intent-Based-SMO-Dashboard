"use client";

import React from "react";
import { ChatMessage, MessageBubble } from "./MessageBubble";

interface ConversationMessagesProps {
  chatMessages: ChatMessage[]; // 已完成顯示的訊息
  typingMessage?: ChatMessage | null; // 正在打字中的訊息(可為null)
}

/**
 * 此元件只負責渲染:
 * - chatMessages: 完整訊息列表
 * - typingMessage: 正在打字的訊息（若有）
 */
export function ConversationMessages({
  chatMessages,
  typingMessage,
}: ConversationMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-2 py-4">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* 1) 已完成顯示的訊息 */}
        {chatMessages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}

        {/* 2) 正在打字中的訊息 (typingMessage) */}
        {typingMessage && <MessageBubble msg={typingMessage} isTyping={true} />}
      </div>
    </div>
  );
}
