// 檔案路徑：/hooks/useConversation.js
"use client";

import { useEffect, useRef, useState } from "react";

// 1) ExternalService
import { getConversationHistory } from "../ExternalService/apiService";
import { createWebSocketService } from "../ExternalService/websocketService";

// 2) InternalService
import {
  inboundMessageDecorator,
  outboundMessageDecorator,
} from "../InternalService/messageDecorator";

export function useConversation(conversationId) {
  const wsServiceRef = useRef(null); // 存放我們建立的 WebSocket Service

  // 狀態
  const [isLoading, setIsLoading] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // 聊天紀錄、打字相關
  const [chatMessages, setChatMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [typingMessage, setTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // 輸入框
  const [inputValue, setInputValue] = useState("");

  // 是否自動發送過「初始訊息」
  const [didAutoSend, setDidAutoSend] = useState(false);

  // --------------------------
  // 1. 主流程：先載入歷史，再連線 WebSocket
  // --------------------------
  useEffect(() => {
    if (!conversationId) return;

    (async () => {
      try {
        setIsLoading(true);

        // (1) 先載入歷史紀錄
        const res = await getConversationHistory(conversationId);
        if (res.status === true && Array.isArray(res.data)) {
          const mapped = res.data.map((item) => {
            // 這裡也可用 messageDecorator 做格式轉換
            // 若後端的格式較複雜，可以再做一層 parse
            return {
              role: item.role, // e.g. "user" or "llm"
              content: item.text_content.map((t) => t.content).join("\n"),
            };
          });
          setChatMessages(mapped);
        }

        // (2) 建立 WebSocket 連線
        const wsUrl = `ws://140.118.162.94:30000/ws/conversation/${conversationId}`;
        const service = createWebSocketService({
          url: wsUrl,
          onOpen: () => {
            console.log("[WebSocket] connected:", wsUrl);
            setIsWsConnected(true);
            handleAutoSend(); // 確保已連線後，再檢查是否要發送初始訊息
          },
          onMessage: (evt) => {
            handleReceivedMessage(evt.data);
          },
          onError: (err) => {
            console.error("[WebSocket] error:", err);
          },
          onClose: () => {
            console.log("[WebSocket] disconnected");
            setIsWsConnected(false);
          },
        });
        wsServiceRef.current = service;
      } catch (err) {
        console.error("[useConversation] init error:", err);
      } finally {
        setIsLoading(false);
      }
    })();

    // 若想在 component unmount 時關閉 WebSocket，可加 return
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.close();
      }
    };
  }, [conversationId]);

  // --------------------------
  // 2. 逐字打字效果
  // --------------------------
  useEffect(() => {
    if (pendingMessages.length > 0 && !isTyping) {
      typeNextMessage();
    }
  }, [pendingMessages, isTyping]);

  // --------------------------
  // 函式區域
  // --------------------------
  // a) 處理收訊息
  function handleReceivedMessage(rawData) {
    const message = inboundMessageDecorator(rawData);
    if (!message) return; // 解析失敗則跳過

    if (message.role === "llm") {
      // 若要做逐字打字效果，把它放到 pendingMessages
      setPendingMessages((prev) => [...prev, message]);
    } else {
      // user / other 角色，直接顯示
      setChatMessages((prev) => [...prev, message]);
    }
  }

  // b) 自動發送初始訊息
  function handleAutoSend() {
    if (didAutoSend) return;
    const key = `init_msg_${conversationId}`;
    const initMsg = localStorage.getItem(key);
    if (initMsg) {
      // 先前端顯示訊息
      setChatMessages((prev) => [...prev, { role: "user", content: initMsg }]);
      // 發送
      sendMessage(initMsg);
      localStorage.removeItem(key); // 避免下次刷新又重發
    }
    setDidAutoSend(true);
  }

  // c) 逐字顯示下一個訊息
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

  // d) 對外暴露的發送訊息 API
  function handleSendMessage(msg) {
    if (!conversationId) return;
    const content = (msg ?? inputValue).trim();
    if (!content) return;

    // 清空輸入框
    setInputValue("");

    // 先前端顯示使用者訊息
    const userMsg = { role: "user", content };
    setChatMessages((prev) => [...prev, userMsg]);

    // 真正發送
    sendMessage(content);
  }

  // e) 發送消息 (呼叫 WebSocket Service)
  function sendMessage(content) {
    if (!wsServiceRef.current) return;

    // 用 Decorator 組裝 outbound payload
    const payload = outboundMessageDecorator(content, "test");
    wsServiceRef.current.send(payload);
  }

  // --------------------------
  // 回傳所有需要的資料與方法
  // --------------------------
  return {
    isLoading,
    isWsConnected,
    inputValue,
    setInputValue,
    chatMessages,
    typingMessage,
    handleSendMessage,
  };
}
