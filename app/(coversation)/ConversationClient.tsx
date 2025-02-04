"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { ChatMessage } from "./MessageBubble";

// 若需要載入歷史紀錄
import { getConversationHistory } from "./service";

interface Props {
  conversationId: string; // 路由參數: conversation_uid
}

// event_type 與 role 對應
const ROLE_MAPPING: Record<string, ChatMessage["role"]> = {
  user_message: "user",
  llm_message: "llm",
};

export default function ConversationClient({ conversationId }: Props) {
  const { width } = useWindowSize();
  const { open } = useSidebar();

  // --------------------------
  // State區域
  // --------------------------
  // 用 useRef 儲存 WebSocket 物件
  const wsRef = useRef<WebSocket | null>(null);

  // 是否正在載入(例如歷史紀錄 or 送出訊息)
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket 是否已成功連線
  const [isWsConnected, setIsWsConnected] = useState(false);

  // 輸入框內容
  const [inputValue, setInputValue] = useState("");

  // 聊天室中已顯示的訊息
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 用於逐字打字
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // 是否已經自動送出過「初始訊息」
  const [didAutoSend, setDidAutoSend] = useState(false);

  // --------------------------
  // 1. (可選) 載入歷史紀錄
  // --------------------------
  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);

    getConversationHistory(conversationId)
      .then((data) => {
        if (data.status === true && Array.isArray(data.data)) {
          const mapped = data.data.map((item: any) => {
            const role = item.role;
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

  // --------------------------
  // 2. 建立原生 WebSocket 連線
  // --------------------------
  useEffect(() => {
    if (!conversationId) return;

    const wsUrl = `ws://140.118.162.94:30000/ws/conversation/${conversationId}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("[WebSocket] connected:", wsUrl);
      setIsWsConnected(true); // 連線成功後，將 isWsConnected 設為 true
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
      setIsWsConnected(false); // 斷線後設為 false，看是否要重連
    };

    // 離開此頁時，關閉連線
    return () => {
      socket.close();
    };
  }, [conversationId]);

  // --------------------------
  // 3. 逐字打字效果
  // --------------------------
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

    // 顯示一個 "Thinking..."
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

  // --------------------------
  // 4. 使用者送出訊息
  // --------------------------
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
            content,
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

  // --------------------------
  // 5. 確保 WebSocket 已連線後，再發送「初始訊息」
  // --------------------------
  useEffect(() => {
    // 只執行一次：尚未自動發送 & 確定 WebSocket 已連線
    if (!didAutoSend && isWsConnected) {
      const key = `init_msg_${conversationId}`;
      const initMsg = localStorage.getItem(key);
      if (initMsg) {
        // 有暫存的初始訊息 -> 自動送出
        handleSendMessage(initMsg);

        // 送完後刪除，避免重新整理時又重送
        localStorage.removeItem(key);
      }
      setDidAutoSend(true);
    }
  }, [didAutoSend, isWsConnected, conversationId]);

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
