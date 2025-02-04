// 檔名：/hooks/useConversation.js
"use client";

import { useEffect, useRef, useState } from "react";
import { getConversationHistory } from "../ExternalService/apiservice"; // 依實際檔案位置調整

/**
 * 自訂 Hook：負責管理整個對話邏輯
 *
 * @param {string} conversationId - 後端提供的對話 ID
 */
export function useConversation(conversationId) {
  const wsRef = useRef(null);

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

  // event_type 與 role 對應
  const ROLE_MAPPING = {
    user_message: "user",
    llm_message: "llm",
  };

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
            const role = item.role;
            const content = item.text_content.map((t) => t.content).join("\n");
            return { role, content };
          });
          setChatMessages(mapped);
        }

        // (2) 建立 WebSocket 連線
        const wsUrl = `ws://140.118.162.94:30000/ws/conversation/${conversationId}`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        // 綁定事件
        socket.onopen = () => {
          console.log("[WebSocket] connected:", wsUrl);
          setIsWsConnected(true);
          handleAutoSend(socket);
        };

        socket.onmessage = (evt) => {
          handleReceivedMessage(evt.data);
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

  // --------------------------
  // 函式區域
  // --------------------------
  // a) 處理收訊息
  function handleReceivedMessage(rawData) {
    try {
      const data = JSON.parse(rawData);
      const { event_type, text } = data;
      const role = ROLE_MAPPING[event_type] || "llm";

      const content =
        text?.text_content
          ?.map((t) => t.content)
          .filter(Boolean)
          .join("\n") || "";

      if (role === "llm") {
        // 若要做逐字打字效果，把它放到 pendingMessages
        setPendingMessages((prev) => [...prev, { role, content }]);
      } else {
        // user / other 角色，直接顯示
        setChatMessages((prev) => [...prev, { role, content }]);
      }
    } catch (err) {
      console.error("[WebSocket] parse error:", err, rawData);
    }
  }

  // b) 自動發送初始訊息
  function handleAutoSend(socket) {
    if (didAutoSend) return;
    const key = `init_msg_${conversationId}`;
    const initMsg = localStorage.getItem(key);
    if (initMsg) {
      // 有暫存的「初始訊息」 -> 送出
      sendMessage(initMsg, socket);

      // 若要避免「下次刷新」又重發，可以移除
      localStorage.removeItem(key);
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

    // 若連線已開啟，才發送
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage(content, wsRef.current);
    } else {
      console.error("[WebSocket] not connected or not open.");
    }
  }

  // e) 發送消息到 WebSocket
  function sendMessage(content, socket) {
    const payload = {
      event_type: "test", // 與後端協定好的事件類型
      text: {
        text_content: [{ type: "message", content }],
      },
    };
    try {
      socket.send(JSON.stringify(payload));
    } catch (err) {
      console.error("[WebSocket] send error:", err);
    }
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
