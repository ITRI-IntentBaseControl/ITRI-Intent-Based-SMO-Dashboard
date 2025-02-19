"use client";
import React from "react";
import { SparklesIcon } from "@/components/icons";
import { ReaderDynamicContent } from "./RenderDynamicContent";

/**
 * ChatMessage:
 * - role: 角色，可為 "user" 或 "assistant"
 * - type: "text" | "table" | "option"
 * - content: 依 type 不同
 */
export function TestMessageBubble({ msg, isTyping = false, onSelectOption }) {
  const { role, type, content } = msg;
  const isUser = role === "user";
  const isAssistant = role === "llm";

  return (
    <div data-role={role} className="group/message w-full px-4">
      <div className={`flex gap-4 w-full ${isUser ? "justify-end" : ""}`}>
        {/* 助理的頭像 */}
        {isAssistant && (
          <div className="size-8 flex items-center justify-center rounded-full ring-1 ring-border bg-background shrink-0">
            <SparklesIcon size={14} />
          </div>
        )}

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
          {/* 如果是助理，就使用 RenderDynamicContent 來渲染 (text/table/option) */}
          {isAssistant ? (
            <ReaderDynamicContent
              data={[{ type, content }]}
              onSelectOption={onSelectOption}
            />
          ) : (
            // 否則視為使用者訊息 -> 顯示純文字
            <p>{content}</p>
          )}

          {/* 顯示 "正在輸入..." 之類的標記 */}
          {isTyping && (
            <span className="text-xs text-muted-foreground">正在輸入...</span>
          )}
        </div>
      </div>
    </div>
  );
}
