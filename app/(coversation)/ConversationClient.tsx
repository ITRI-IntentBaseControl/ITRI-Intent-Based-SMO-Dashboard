"use client";

import React, { useEffect, useState } from "react";
import { useMessageHandler } from "@/app/hooks/useMessageHandler";
import { sendMessageAPI } from "@/app/api/message/route";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";
import { ConversationHeader } from "./ConversationHeader";

// 子元件
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { ChatMessage } from "./MessageBubble";

interface Props {
  conversationId: string;
  /** 由 SSR 或 root page 帶入的初始訊息，多半視為 user 所發起 */
  initialMessages?: string[];
  brokerUrl: string;
}

export default function ConversationClient({
  conversationId,
  initialMessages = [],
  brokerUrl,
}: Props) {
  const { width } = useWindowSize();
  const [isSidebarOpen] = useState(width > 768);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { open } = useSidebar();

  // 不放 initialMessages 到 state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // 1. 從後端訂閱
  const { messages, subscribeTopic } = useMessageHandler({ brokerUrl });

  // 2. 訂閱指定話題
  useEffect(() => {
    const topic = `conversations/${conversationId}`;
    subscribeTopic(topic);
  }, [conversationId, subscribeTopic]);

  // 3. 收到後端回覆 (assistant) -> 推入 pendingMessages
  useEffect(() => {
    if (messages.length > 0) {
      const incoming = messages.map((m) => ({
        role: "assistant",
        content: m,
      })) satisfies ChatMessage[];
      setPendingMessages((prev) => [...prev, ...incoming]);
    }
  }, [messages]);

  // 4. 依序打字顯示 assistant 訊息
  useEffect(() => {
    if (pendingMessages.length > 0 && !isTyping) {
      typeNextMessage();
    }
  }, [pendingMessages, isTyping]);

  async function typeNextMessage() {
    if (pendingMessages.length === 0) return;
    setIsTyping(true);

    const [nextMsg, ...others] = pendingMessages;
    setPendingMessages(others);

    // 顯示 "Thinking..."
    setTypingMessage({ role: "assistant", content: "Thinking..." });
    await new Promise((r) => setTimeout(r, 1000)); // 模擬思考1秒

    // 逐字打字
    let partial = "";
    for (let i = 0; i < nextMsg.content.length; i++) {
      partial += nextMsg.content[i];
      setTypingMessage({ role: "assistant", content: partial });
      await new Promise((r) => setTimeout(r, 10));
    }

    // 完成
    setChatMessages((prev) => [...prev, nextMsg]);
    setTypingMessage(null);
    setIsTyping(false);
  }

  // 手動送出
  async function handleSendMessage() {
    if (!conversationId) return;
    if (!inputValue.trim()) return;

    await sendUserMessage(inputValue);
    setInputValue("");
  }

  // 送「user」訊息
  async function sendUserMessage(content: string) {
    try {
      setIsLoading(true);

      // 1) 前端插入
      const userMsg: ChatMessage = { role: "user", content };
      setChatMessages((prev) => [...prev, userMsg]);

      // 2) 呼叫 API
      const data = await sendMessageAPI(conversationId, content);
      if (data.error) {
        console.error("Send message error:", data.error);
      }
    } catch (error) {
      console.error("Send message failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // 5. 首次載入後，隔個 500ms 再送出 first message
  const [didAutoSend, setDidAutoSend] = useState(false);
  useEffect(() => {
    if (!didAutoSend && initialMessages.length > 0) {
      setDidAutoSend(true);

      // 等 0.5 秒再送出第一筆，避免 topic 尚未完成
      const timer = setTimeout(async () => {
        for (const msg of initialMessages) {
          await sendUserMessage(msg);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      {/* 頂部 header */}
      <ConversationHeader />

      {/* 訊息列表 */}
      <ConversationMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
      />

      {/* 輸入框 */}
      <ConversationInput
        inputValue={inputValue}
        onChange={(val: any) => setInputValue(val)}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
