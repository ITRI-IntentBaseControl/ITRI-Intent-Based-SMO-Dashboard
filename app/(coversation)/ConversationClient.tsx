"use client";

import React, { useEffect, useState } from "react";
import { useMessageHandler } from "@/app/hooks/useMessageHandler";
import { sendMessageAPI } from "@/app/api/message/route";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";

interface Props {
  conversationId: string; // 由 page.tsx 帶進來
  initialMessages?: string[];
  brokerUrl: string;
}

export default function ConversationClient({
  conversationId,
  initialMessages = [],
  brokerUrl,
}: Props) {
  const { width } = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(width > 768);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { open } = useSidebar();

  // 把 SSR 帶進來的初始訊息放到 allMessages
  const [allMessages, setAllMessages] = useState([...initialMessages]);

  // 使用我們的 Hook，尚未指定初始 topic
  const { messages, subscribeTopic } = useMessageHandler({
    brokerUrl,
  });

  // 一旦元件掛載，就訂閱 "conversations/{conversationId}"
  useEffect(() => {
    const topic = `conversations/${conversationId}`;
    subscribeTopic(topic);
  }, [conversationId, subscribeTopic]);

  // 每當 Hook 收到新 messages，就合併到 allMessages
  useEffect(() => {
    if (messages.length > 0) {
      setAllMessages((prev) => [...prev, ...messages]);
    }
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async () => {
    if (!conversationId) return;
    try {
      const data = await sendMessageAPI(conversationId, inputValue);
      if (data.error) {
        alert(data.error);
      } else {
        setInputValue("");
      }
    } catch (error) {
      console.error("Send message failed:", error);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      {/* 2. 使用抽離後的 Header Component */}
      <ConversationHeader />

      {/* 其餘部分依舊保留在此 */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "8px" }}>
        {allMessages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
}
