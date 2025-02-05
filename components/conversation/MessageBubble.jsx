"use client";

import React from "react";
import { SparklesIcon } from "@/components/icons";

/**
 * ChatMessage:
 * - role: 角色，可為 "user" 或 "assistant"
 * - content: 文字內容
 *
 * MessageBubbleProps:
 * - msg: ChatMessage 物件
 * - isTyping: 是否正在打字中 (可選)
 */
export function MessageBubble({ msg, isTyping = false }) {
  const { role, content } = msg;
  const isUser = role === "user";
  const isAssistant = role === "llm"; // 若與後端實際傳回的角色不符，可自行調整

  return (
    <div data-role={role} className="group/message w-full px-4">
      <div className={`flex gap-4 w-full ${isUser ? "justify-end" : ""}`}>
        {isAssistant && (
          <div className="size-8 flex items-center justify-center rounded-full ring-1 ring-border bg-background shrink-0">
            <SparklesIcon size={14} />
          </div>
        )}

        {/*
          1) `whitespace-pre-wrap break-words`：確保長字串會換行
          2) User：max-w-[50%]
          3) Assistant：max-w-[80%]
        */}
        <div
          className={`
            flex flex-col gap-2 
            whitespace-pre-wrap break-words
            ${
              isUser
                ? "max-w-[50%] bg-primary text-primary-foreground px-3 py-2 rounded-xl"
                : "max-w-[80%]"
            }
          `}
        >
          <div>
            {content}
            {isTyping && (
              <span className="inline-block bg-muted-foreground w-1 ml-1 animate-blink">
                &nbsp;
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
