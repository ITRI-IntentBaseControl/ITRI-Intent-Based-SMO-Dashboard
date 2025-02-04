"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { ChatMessage } from "./MessageBubble";

// 若仍保留後端歷史紀錄 API，可匯入
import { getConversationHistory } from "./service";

/**
 * ChatMessage: 前端顯示的訊息資料結構
 * role: "user" | "llm"
 * content: string
 */
interface Props {
  conversationId: string; // 路由參數: conversation_uid
  initialMessages?: string[]; // 例如從 URL 帶入的初始訊息(?msg=xxx)
}

// event_type 與 role 的對應示範，可自行依後端實際規劃調整
const ROLE_MAPPING: Record<string, ChatMessage["role"]> = {
  user_message: "user",
  llm_message: "llm",
  // 可擴充更多 event_type => role
};

export default function ConversationClient({
  conversationId,
  initialMessages = [],
}: Props) {
  const { width } = useWindowSize();
  const { open } = useSidebar();

  // WebSocket 連線參考
  const wsRef = useRef<WebSocket | null>(null);

  // 是否正在載入(例如載入歷史紀錄 or 送出訊息)
  const [isLoading, setIsLoading] = useState(false);

  // 使用者在輸入框的文字
  const [inputValue, setInputValue] = useState("");

  // 聊天室中已顯示的訊息
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 用於逐字打字
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // 1. (可選) 載入歷史紀錄
  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);

    getConversationHistory(conversationId)
      .then((data) => {
        if (data.status === true && Array.isArray(data.data)) {
          const mapped = data.data.map((item: any) => {
            const role = item.role; // 由後端決定
            const content = item.text_content
              .map((t: any) => t.content)
              .join("\n");
            return { role, content } as ChatMessage;
          });
          setChatMessages(mapped);
        }
      })
      .catch((err) => {
        console.error("fetchConversationHistory error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversationId]);

  // 2. 建立原生 WebSocket 連線
  useEffect(() => {
    if (!conversationId) return;

    const wsUrl = `ws://140.118.162.94:30000/ws/conversation/${conversationId}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("[WebSocket] connected:", wsUrl);
    };

    socket.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        const { event_type, text } = data;
        const role = ROLE_MAPPING[event_type] ?? "llm";
        const content =
          text?.text_content
            ?.map((t: any) => t.content)
            .filter(Boolean)
            .join("\n") || "";

        if (role === "llm") {
          // 若要模擬逐字打字
          setPendingMessages((prev) => [...prev, { role, content }]);
        } else {
          // user 或其他角色，直接顯示
          setChatMessages((prev) => [...prev, { role, content }]);
        }
      } catch (err) {
        console.error("[WebSocket] parse error:", err, evt.data);
      }
    };

    socket.onerror = (err) => {
      console.error("[WebSocket] error:", err);
    };

    socket.onclose = () => {
      console.log("[WebSocket] disconnected");
    };

    // 離開時關閉連線
    return () => {
      socket.close();
    };
  }, [conversationId]);

  // 3. 逐字打字效果
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

    // 顯示一個 "Thinking..." (可自行替換為其他提示)
    setTypingMessage({ role: "llm", content: "Thinking..." });
    await new Promise((r) => setTimeout(r, 500));

    // 逐字顯示
    let partial = "";
    for (let i = 0; i < nextMsg.content.length; i++) {
      partial += nextMsg.content[i];
      setTypingMessage({ role: "llm", content: partial });
      await new Promise((r) => setTimeout(r, 10));
    }

    setChatMessages((prev) => [...prev, nextMsg]);
    setTypingMessage(null);
    setIsTyping(false);
  }

  // 4. 使用者送出訊息 => 經由 WebSocket 傳給後端
  async function handleSendMessage(message?: string) {
    if (!conversationId) return;
    const content = (message ?? inputValue).trim();
    if (!content) return;

    // 清空輸入框
    setInputValue("");

    // 前端顯示使用者訊息
    const userMsg: ChatMessage = { role: "user", content };
    setChatMessages((prev) => [...prev, userMsg]);

    // 組裝後端預期的訊息結構
    const payload = {
      event_type: "test", // 依後端定義
      text: {
        text_content: [
          {
            type: "message",
            content: content,
          },
        ],
      },
    };

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
      } else {
        console.error("[WebSocket] not connected or not open.");
      }
    } catch (err) {
      console.error("[WebSocket] send error:", err);
    }
  }

  // 5. 若有 initialMessages，進入頁面時自動送出
  const [didAutoSend, setDidAutoSend] = useState(false);
  useEffect(() => {
    if (!conversationId) return;
    if (!didAutoSend && initialMessages.length > 0) {
      setDidAutoSend(true);
      setTimeout(() => {
        initialMessages.forEach((msg) => {
          // 這裡直接把要傳的訊息當作參數帶進去
          handleSendMessage(msg);
        });
      }, 500);
    }
  }, [conversationId, initialMessages, didAutoSend]);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      {/* 頂部 Header */}
      <ConversationHeader />

      {/* 訊息列表 */}
      <ConversationMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
      />

      {/* 輸入區域 */}
      <ConversationInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
