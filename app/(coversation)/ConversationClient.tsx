"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { ChatMessage } from "./MessageBubble";

import { getConversationHistory } from "./ExternalService/apiservice";

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

  // 用 useRef 儲存 WebSocket 物件
  const wsRef = useRef<WebSocket | null>(null);

  // 狀態
  const [isLoading, setIsLoading] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // 是否已經自動送出初始訊息
  const [didAutoSend, setDidAutoSend] = useState(false);

  // --------------------------
  // 1. 主流程：先載入歷史，再連線 WebSocket，最後送初始訊息
  // --------------------------
  useEffect(() => {
    if (!conversationId) return;

    (async () => {
      try {
        setIsLoading(true);

        // 1) 先載入歷史紀錄 (一定要先做)
        const res = await getConversationHistory(conversationId);
        if (res.status === true && Array.isArray(res.data)) {
          const mapped = res.data.map((item: any) => {
            const role = item.role;
            const content = item.text_content
              .map((t: any) => t.content)
              .join("\n");
            return { role, content } as ChatMessage;
          });
          // 這裡「覆蓋」chatMessages沒問題，因為使用者還沒發送新訊息
          setChatMessages(mapped);
        }

        // 2) 建立 WebSocket 連線
        const wsUrl = `ws://140.118.162.94:30000/ws/conversation/${conversationId}`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        // 綁定事件
        socket.onopen = () => {
          console.log("[WebSocket] connected:", wsUrl);
          setIsWsConnected(true);

          // 3) 在 onopen 裡，確定已連線後，檢查是否有「初始訊息」
          if (!didAutoSend) {
            const key = `init_msg_${conversationId}`;
            const initMsg = localStorage.getItem(key);
            if (initMsg) {
              // 有暫存的「初始訊息」 -> 送出
              handleSendMessage(initMsg);

              // 若要避免「下次刷新」又重發，可以移除
              localStorage.removeItem(key);
            }
            setDidAutoSend(true);
          }
        };

        socket.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            const { event_type, text } = data;
            const role = ROLE_MAPPING[event_type] ?? "llm";

            // 組合 content
            const content =
              text?.text_content
                ?.map((t: any) => t.content)
                .filter(Boolean)
                .join("\n") || "";

            if (role === "llm") {
              // 若要做逐字打字效果，把它放到 pendingMessages
              setPendingMessages((prev) => [...prev, { role, content }]);
            } else {
              // user or other 角色，直接顯示
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
          setIsWsConnected(false);
        };
      } catch (err) {
        console.error("Load conversation or connect WS error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [conversationId]);

  // --------------------------
  // 2. 逐字打字效果
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

    // 最終完整訊息加到 chatMessages
    setChatMessages((prev) => [...prev, nextMsg]);
    setTypingMessage(null);
    setIsTyping(false);
  }

  // --------------------------
  // 3. 使用者（或初始）送出訊息
  // --------------------------
  async function handleSendMessage(message?: string) {
    if (!conversationId) return;

    // 預設用 inputValue；若有傳參數 message，就用 message
    const content = (message ?? inputValue).trim();
    if (!content) return;

    // 清空輸入框
    setInputValue("");

    // 先在前端立即顯示使用者訊息
    const userMsg: ChatMessage = { role: "user", content };
    setChatMessages((prev) => [...prev, userMsg]);

    // 組裝要送給後端的訊息
    const payload = {
      event_type: "test", // 後端定義
      text: {
        text_content: [{ type: "message", content }],
      },
    };

    try {
      // 若 WebSocket 已連線，送出
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
      } else {
        console.error("[WebSocket] not connected or not open.");
      }
    } catch (err) {
      console.error("[WebSocket] send error:", err);
    }
  }
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
