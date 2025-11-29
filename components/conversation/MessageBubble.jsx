"use client";
import React from "react";
import { SparklesIcon } from "@/components/icons";
import { motion } from "framer-motion";
import { RenderDynamicContent } from "./RenderDynamicContent";

/**
 * 顏色改為使用 shadcn/tailwind 的語義化 token，
 * 例如：bg-primary / text-primary-foreground / bg-muted / text-foreground / border-border。
 * 這些會跟隨 next-themes 的黑/白主題自動切換，不再硬寫 bg-gray-300 / bg-zinc-900。
 */
export function MessageBubble({ msg, onSelectOption, conversationId }) {
  const { role, text_content } = msg;
  const isUser = role === "user";
  const isAssistant = role === "llm";

  // 共用 class：泡泡樣式
  const bubbleBase =
    "flex flex-col gap-2 whitespace-pre-wrap break-words px-3 py-2 rounded-xl ring-1";
  const userBubble =
    "max-w-[60%] bg-primary text-primary-foreground ring-primary/30";
  const assistantBubble = "max-w-[80%] text-foreground ring-border";

  // 「思考中」的佔位
  const thinking = (
    <p className="rounded-lg px-3 py-2 italic text-center text-muted-foreground">
      Thinking…
    </p>
  );

  return (
    <div data-role={role} className="group/message w-full px-4 py-2">
      <div className={`flex gap-4 w-full ${isUser ? "justify-end" : ""}`}>
        {/* 助理頭像（會隨主題變化的背景/邊框） */}
        {isAssistant && (
          <div className="size-8 flex items-center justify-center rounded-full ring-1 ring-border bg-background shrink-0">
            <SparklesIcon size={14} />
          </div>
        )}

        {/* 泡泡本體：依使用者/助理套不同語義色 */}
        <div
          className={`${bubbleBase} ${isUser ? userBubble : assistantBubble}`}
        >
          {isUser && <p>{msg.content}</p>}

          {isAssistant &&
            (text_content && text_content.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <RenderDynamicContent
                  data={text_content}
                  onSelectOption={onSelectOption}
                  conversationId={conversationId}
                />
              </motion.div>
            ) : (
              thinking
            ))}
        </div>
      </div>
    </div>
  );
}
