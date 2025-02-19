"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TestHeader from "./TestHeader";
import TestMessages from "./TestMessages";
import TestInput from "./TestInput";

import { createConversation } from "@/app/service/conversation/ExternalService/apiService";
import { useConversation } from "@/app/hooks/conversation/useConversation";

export default function TestClient({
  userUid,
  conversationUid,
  initialMessages = [],
  defaultUserInput = "",
}) {
  const router = useRouter();

  //如果沒有conversationUid，但有userUid，就自動呼叫後端建立對話
  useEffect(() => {
    if (!conversationUid && userUid) {
      (async () => {
        try {
          const response = await createConversation(userUid);
          const newConversationUid = response?.data?.conversation_uid;
          //建立完直接導向新的conversation
          router.push(`/test?conversation_uid=${newConversationUid}`);
        } catch (error) {
          console.error("建立對話失敗：", error);
          alert("建立對話失敗，請稍後再試");
        }
      })();
    }
  }, [conversationUid, userUid, router]);

  //從自訂hook中取得對話管理邏輯
  const {
    isLoading,
    inputValue,
    setInputValue,
    chatMessages,
    typingMessage,
    handleSendMessage,
  } = useConversation(conversationUid, initialMessages, defaultUserInput);

  //按下option後讓文字進到使用者輸入框
  function handleOptionSelect(label) {
    setInputValue(label);
  }

  // // 送出訊息
  // const handleSendMessage = async () => {
  //   if (!inputValue.trim()) return;
  //   //未取得 userUid，無法建立對話
  //   if (!userUid) {
  //     alert("無法取得userUid，請確認是否已寫入localStorage");
  //     return;
  //   }

  //   // 1) 先把使用者訊息加入 messages
  //   const userMsg = {
  //     id: `user-${Date.now()}`,
  //     role: "user",
  //     type: "text",
  //     content: inputValue,
  //     timestamp: new Date().toISOString(),
  //   };
  //   setChatMessages((prev) => [...prev, userMsg]);
  //   setInputValue("");

  //   // 2) 開始準備呼叫後端建立對話
  //   setIsLoading(true);
  //   setTypingMessage({
  //     id: `typing-${Date.now()}`,
  //     role: "llm",
  //     type: "text",
  //     content: conversationUid ? "傳送訊息到已存在對話..." : "建立新對話中...",
  //     timestamp: new Date().toISOString(),
  //   });

  //   try {
  //     //呼叫後端api，取得conversation_uid
  //     if (!conversationUid) {
  //       const response = await createConversation(userUid);
  //       const conversation_uid = response?.data?.conversation_uid;

  //       localStorage.setItem(`init_msg_${conversation_uid}`, userMsg.content);

  //       // 跳轉到 `/test?conversation_uid=${conversation_uid}`
  //       router.push(`/test?conversation_uid=${conversation_uid}`);
  //     }
  //   } catch (error) {
  //     console.error("對話流程失敗：", error);
  //     alert("對話流程失敗，請稍後再試。");
  //   } finally {
  //     setTypingMessage(null);
  //     setIsLoading(false);
  // }
  // };
  console.log(chatMessages);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 頂部 Header */}
      <TestHeader />

      {/* 訊息列表 */}
      <TestMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
        onSelectOption={handleOptionSelect}
      />

      {/* 輸入區域 */}
      <TestInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
