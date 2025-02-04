"use client";

import React, { useEffect, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { ChatMessage } from "./MessageBubble";

// WebSocket / Stomp Hooks
import { useMessageHandler } from "@/app/hooks/useMessageHandler";
import { sendMessageAPI } from "@/app/api/message/route";

// 從我們新建立的 conversationService 匯入
import { getConversationHistory } from "./service";

interface Props {
  conversationId: string;
  /** 可選：由 URL 或其他來源帶入的初始訊息 */
  initialMessages?: string[];
  /** WebSocket broker 的 URL */
  brokerUrl: string;
}

export default function ConversationClient({
  conversationId,
  initialMessages = [],
  brokerUrl,
}: Props) {
  const { width } = useWindowSize();
  const { open } = useSidebar();

  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 「等待打字中」或「尚未輸出完整」的訊息
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // 1. 取得歷史紀錄
  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);

    getConversationHistory(conversationId)
      .then((data) => {
        // data = { status: true, message: "...", data: [...] }
        if (data.status === true && Array.isArray(data.data)) {
          // 將 data.data 轉成前端需要的 chatMessages 格式
          const mapped = data.data.map((item: any) => {
            // 後端 role: 'user' 或 'llm'
            // 前端若要將 llm => assistant，可以這樣:
            const role = item.role;

            // 將 text_content 裡的 content 用換行拼起來
            const content = item.text_content
              .map((t: any) => t.content)
              .filter(Boolean)
              .join("\n");

            return { role, content } as ChatMessage;
          });
          setChatMessages(mapped);
        } else {
          console.error("API 回傳結構不符合預期:", data);
        }
      })
      .catch((err) => {
        console.error("fetchConversationHistory error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversationId]);

  // 2. WebSocket: 從後端訂閱特定話題
  const { messages, subscribeTopic } = useMessageHandler({ brokerUrl });
  useEffect(() => {
    if (!conversationId) return;
    const topic = `conversations/${conversationId}`;
    subscribeTopic(topic);
  }, [conversationId, subscribeTopic]);

  // 收到後端 (assistant) 新訊息 => 推到 pendingMessages
  useEffect(() => {
    if (messages.length > 0) {
      const incoming = messages.map((m) => ({
        role: "assistant",
        content: m,
      })) satisfies ChatMessage[];
      setPendingMessages((prev) => [...prev, ...incoming]);
    }
  }, [messages]);

  // 3. 模擬逐字打字
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
    await new Promise((r) => setTimeout(r, 500));

    let partial = "";
    for (let i = 0; i < nextMsg.content.length; i++) {
      partial += nextMsg.content[i];
      setTypingMessage({ role: "assistant", content: partial });
      await new Promise((r) => setTimeout(r, 10));
    }

    setChatMessages((prev) => [...prev, nextMsg]);
    setTypingMessage(null);
    setIsTyping(false);
  }

  // 4. 手動送出訊息
  async function handleSendMessage() {
    if (!conversationId) return;
    if (!inputValue.trim()) return;

    const content = inputValue.trim();
    setInputValue("");

    await sendUserMessage(content);
  }

  // 寫入 user 訊息 -> 後端 API -> WS 廣播
  async function sendUserMessage(content: string) {
    try {
      setIsLoading(true);

      const userMsg: ChatMessage = { role: "user", content };
      setChatMessages((prev) => [...prev, userMsg]);

      const data = await sendMessageAPI(conversationId, content);
      if (data.error) {
        console.error("Send message error:", data.error);
      }
    } catch (error) {
      console.error("Send user message failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // 5. 初始訊息（若 URL 帶 ?msg=xxx）
  const [didAutoSend, setDidAutoSend] = useState(false);
  useEffect(() => {
    if (!conversationId) return;
    if (!didAutoSend && initialMessages.length > 0) {
      setDidAutoSend(true);
      setTimeout(async () => {
        for (const msg of initialMessages) {
          await sendUserMessage(msg);
        }
      }, 500);
    }
  }, [conversationId, initialMessages, didAutoSend]);

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
        onChange={(val) => setInputValue(val)}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
