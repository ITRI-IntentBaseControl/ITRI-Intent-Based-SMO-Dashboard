"use client";
import React from "react";
import { SparklesIcon } from "@/components/icons";
import { RenderDynamicContent } from "./RenderDynamicContent";

/**
 * 一條訊息的結構：
 * - user: { role: "user", content: "..." }
 * - llm(最終): { role: "llm", text_content: [{ type, content }, ...] }
 * - llm(打字中): { role: "llm", content: "...(partial text)" }
 */
export function TestMessageBubble({
  msg,
  isTyping = false,
  onSelectOption,
  conversationId,
}) {
  const { role, content, text_content } = msg;
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
          {/* 如果是 user，就直接顯示 content */}
          {isUser && <p>{content}</p>}

          {/* 如果是 llm，可能是「打字中」或「最終」 */}
          {isAssistant && text_content && text_content.length > 0 && (
            // 有 text_content -> 用 RenderDynamicContent 來顯示多段型態
            <RenderDynamicContent
              data={text_content}
              conversationId={conversationId}
              onSelectOption={onSelectOption}
            />
          )}

          {isAssistant && (!text_content || text_content.length === 0) && (
            // 沒有 text_content -> 可能是打字中，只顯示 content
            <p>{content}</p>
          )}

          {/* 顯示 "正在輸入..." 之類的標記 */}
          {/* {isTyping && (
            <span className="text-xs text-muted-foreground">正在輸入...</span>
          )} */}
        </div>
      </div>
    </div>
  );
}
