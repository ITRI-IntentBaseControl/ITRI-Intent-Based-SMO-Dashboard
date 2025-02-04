"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";

import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { ChatMessage } from "./MessageBubble";

// 若仍保留後端歷史紀錄API，可匯入
import { getConversationHistory } from "./service";

/**
 * ChatMessage: 前端顯示的訊息資料結構
 * role: "user" | "assistant"
 * content: string
 */
interface Props {
  conversationId: string; // 路由參數: conversation_uid
  initialMessages?: string[]; // 例如從 URL 帶入的初始訊息(?msg=xxx)
}

// event_type 與 role 的對應示範，可自行依後端實際規劃調整
const ROLE_MAPPING: Record<string, ChatMessage["role"]> = {
  user_message: "user",
  assistant_message: "assistant",
  // 也可擴充更多 event_type => role
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

  // 模擬逐字打字
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
          // 後端資料 => chatMessages
          const mapped = data.data.map((item: any) => {
            // 你可以根據後端 event_type / role 來決定前端 role
            const role = item.role;
            // 將 text_content 陣列組成一個字串
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

    // 連線成功
    socket.onopen = () => {
      console.log("[WebSocket] connected:", wsUrl);
    };

    // 收到訊息
    socket.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);

        // 假設後端回傳:
        // {
        //   event_type: <string>,
        //   text: {
        //     text_uid: <string>,
        //     text_content: [{ type, content }, ...]
        //   }
        // }
        const { event_type, text } = data;
        const role = ROLE_MAPPING[event_type] ?? "assistant";
        const content =
          text.text_content
            ?.map((t: any) => t.content)
            .filter(Boolean)
            .join("\n") || "";

        // 這裡可直接 push 到 chatMessages
        // 或者若是 role=assistant 時，想用「逐字打字」效果，就 push 到 pendingMessages
        if (role === "assistant") {
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

    // WebSocket 錯誤處理
    socket.onerror = (err) => {
      console.error("[WebSocket] error:", err);
    };

    // WebSocket 關閉
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

    // 顯示一個 "Thinking..."
    setTypingMessage({ role: "assistant", content: "Thinking..." });
    await new Promise((r) => setTimeout(r, 500));

    // 逐字顯示
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

  // 4. 使用者送出訊息 => 經由 WebSocket 傳給後端
  async function handleSendMessage() {
    if (!conversationId) return;
    const content = inputValue.trim();
    if (!content) return;
    setInputValue("");

    // 先在前端顯示 user 訊息
    const userMsg: ChatMessage = { role: "user", content };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      // 組裝後端預期的訊息結構:
      const payload = {
        event_type: "test",
        text: {
          text_content: [
            {
              type: "message",
              content, // 使用者輸入的文字
            },
          ],
        },
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
      } else {
        console.error("[WebSocket] not connected or not open.");
      }
    } catch (err) {
      console.error("[WebSocket] send error:", err);
    }
  }

  // (可選) 5. 若需在進入頁面時自動發送訊息
  const [didAutoSend, setDidAutoSend] = useState(false);
  useEffect(() => {
    if (!conversationId) return;
    if (!didAutoSend && initialMessages.length > 0) {
      setDidAutoSend(true);
      setTimeout(() => {
        initialMessages.forEach((msg) => {
          setInputValue(msg);
          handleSendMessage();
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
        typingMessage={typingMessage} // 若保留逐字打字
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
