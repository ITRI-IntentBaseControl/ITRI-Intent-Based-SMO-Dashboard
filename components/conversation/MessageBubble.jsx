"use client";
import React from "react";
import { SparklesIcon } from "@/components/icons";
import { motion } from "framer-motion";
import { RenderDynamicContent } from "../test/RenderDynamicContent";

export function MessageBubble({ msg, isTyping = false, onSelectOption }) {
  const { role, text_content } = msg;
  const isUser = role === "user";
  const isAssistant = role === "llm";
  // console.log(text_content);
  return (
    <div data-role={role} className="group/message w-full px-4">
      <div className={`flex gap-4 w-full ${isUser ? "justify-end" : ""}`}>
        {isAssistant && (
          <div className="size-8 flex items-center justify-center rounded-full ring-1 ring-border bg-background shrink-0">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={`
            flex flex-col gap-2 whitespace-pre-wrap break-words
            ${
              isUser
                ? "max-w-[50%] bg-primary text-primary-foreground px-3 py-2 rounded-xl bg-gray-300"
                : "max-w-[80%]"
            }
          `}
        >
          {isUser && <p>{msg.content}</p>}

          {isAssistant &&
            (text_content && text_content.length > 0 ? (
              // ——— 這邊把 RenderDynamicContent 包進 motion.div ———
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <RenderDynamicContent
                  data={text_content}
                  onSelectOption={onSelectOption}
                />
              </motion.div>
            ) : isTyping ? (
              <p className="bg-zinc-900 rounded-lg border p-4 italic text-center">
                Thinking…
              </p>
            ) : (
              <p className="bg-zinc-900 rounded-lg border p-4 italic text-center">
                Thinking…
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
