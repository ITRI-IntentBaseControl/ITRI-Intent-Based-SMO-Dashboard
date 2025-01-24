"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import useSWR from "swr"; // 如果不需 SWR，可刪除
import { ChatHeader } from "./chat-header";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { Block } from "./block";

import type { Message } from "ai";
import type { Vote } from "@/lib/db/schema"; // 如果無需 vote，可移除

// 單純 UI type
export type VisibilityType = "private" | "public";

interface ChatProps {
  id: string;
  initialMessages: Message[];
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}

/**
 * Chat：聊天UI主體
 * - 透過 useChat() 來管理 messages, handleSubmit, setMessages 等
 * - 若不需要 ai/react, 可改成你自己的 state management
 */
export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: ChatProps) {
  // 下面是將 fetcher / useSWR 省略到最簡
  //const { data: votes } = useSWR<Array<Vote>>(`/api/vote?chatId=${id}`, fetcher);
  const votes: Array<Vote> | undefined = undefined;

  // 這裡使用 useChat() => 你可自行改成你的 API
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    // ★可換成你後端的 API★
    api: "/api/fake-stream",
    body: { id, modelId: selectedModelId },
    initialMessages,
  });

  // attachments 如果不需要，上下2行可刪
  const [attachments, setAttachments] = useState([]);
  const isBlockVisible = false; // 如果你沒有 block UI, 直接給 false

  return (
    <>
      <div className="flex flex-col min-w-0 h-screen bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        {/* 訊息列表 */}
        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        {/* 輸入區域（只有在非只讀狀態下顯示） */}
        {!isReadonly && (
          <form className="flex mx-auto px-4 bg-background pb-4 w-full max-w-3xl">
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          </form>
        )}
      </div>

      {/* 假裝 block UI，如果不需要可刪 */}
      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
