"use client";

import React, { useState } from "react";
import TestHeader from "./TestHeader";
import TestMessages from "./TestMessages";
import TestInput from "./TestInput";

export default function TestClient({
  initialMessages = [],
  defaultUserInput = "",
}) {
  // 對話訊息列表
  const [chatMessages, setChatMessages] = useState(initialMessages);
  // 使用者輸入
  const [inputValue, setInputValue] = useState(defaultUserInput);
  // 是否載入中(送出中)
  const [isLoading, setIsLoading] = useState(false);
  // 正在打字中的訊息
  const [typingMessage, setTypingMessage] = useState(null);

  // 送出訊息
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // 1) 先把 user 輸入 push 進訊息陣列
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      type: "text",
      content: inputValue,
      timestamp: new Date().toISOString(),
      css: {
        container: "mb-2 p-3 bg-blue-50 rounded-md",
        text: "text-sm text-gray-900",
      },
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // 2) 模擬機器人回覆
    setIsLoading(true);
    setTypingMessage({
      id: `typing-${Date.now()}`,
      role: "assistant",
      type: "text",
      content: "對方正在輸入...",
      timestamp: new Date().toISOString(),
      css: {
        container: "mb-2 p-3 bg-gray-50 rounded-md",
        text: "text-sm text-gray-900 italic",
      },
    });

    setTimeout(() => {
      setTypingMessage(null);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          type: "text",
          content: "這是機器人的範例回覆！",
          timestamp: new Date().toISOString(),
          css: {
            container: "mb-2 p-3 bg-gray-50 rounded-md",
            text: "text-sm text-gray-900",
          },
        },
      ]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 頂部標題區 */}
      <TestHeader />

      {/* 訊息列表 */}
      <TestMessages chatMessages={chatMessages} typingMessage={typingMessage} />

      {/* 下方輸入框 */}
      <TestInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
