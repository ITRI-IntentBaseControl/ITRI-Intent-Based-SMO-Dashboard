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
    isSending,
  } = useConversation(conversationUid, initialMessages, defaultUserInput);

  //按下option後讓文字進到使用者輸入框
  function handleOptionSelect(label) {
    setInputValue(label);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 頂部 Header */}
      <TestHeader />

      {/* 訊息列表 */}
      <TestMessages
        chatMessages={chatMessages}
        typingMessage={typingMessage}
        onSelectOption={handleOptionSelect}
        conversationId={conversationUid}
      />

      {/* 輸入區域 */}
      <TestInput
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
        isSending={isSending}
      />
    </div>
  );
}
