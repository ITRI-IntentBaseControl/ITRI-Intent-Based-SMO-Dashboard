"use client";

import React, { memo, useRef } from "react";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
// import { PreviewMessage, ThinkingMessage } from "./message";
// import { Overview } from "./overview";
import equal from "fast-deep-equal";

// 這些型別在原專案中是 ai/Message or DB/Vote
import type { Message } from "ai";
import type { Vote } from "@/lib/db/schema";
import type { ChatRequestOptions } from "ai";

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void;
  reload: (options?: ChatRequestOptions) => Promise<string | null | undefined>;
  isReadonly: boolean;
  isBlockVisible: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  // Hook：自動讓視窗捲到最底
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {/* 如果 messages.length === 0 可顯示 Overview */}
      {/* {messages.length === 0 && <Overview />} */}

      {/* 原本PreviewMessage / ThinkingMessage可自定義 */}
      {messages.map((message, index) => (
        <div key={message.id} className="px-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-200">
            <strong>{message.role}:</strong> {message.content}
          </p>
        </div>
      ))}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && (
          <div className="px-4 text-sm text-blue-500">Thinking...</div>
        )}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

// 增加 memo 提升效能
export const Messages = memo(PureMessages, (prev, next) => {
  if (prev.isLoading !== next.isLoading) return false;
  if (prev.messages.length !== next.messages.length) return false;
  if (!equal(prev.messages, next.messages)) return false;
  if (!equal(prev.votes, next.votes)) return false;
  return true;
});
