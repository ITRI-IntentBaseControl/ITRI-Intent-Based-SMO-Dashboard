"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "../service/conversation/ExternalService/apiService";
import { Button } from "@/components/ui/button";
import { ConversationHeader } from "@/components/conversation/ConversationHeader";

export default function HomePage() {
  const router = useRouter();
  const [userMessage, setUserMessage] = useState("");
  const [userUid, setUserUid] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // 在元件載入時從 localStorage 抓取 user_uid
  useEffect(() => {
    const storedUserUid =
      typeof window !== "undefined" ? localStorage.getItem("user_uid") : null;
    setUserUid(storedUserUid);
  }, []);

  // 當使用者輸入訊息後
  const handleSend = async () => {
    if (isSending) return;

    try {
      // 確認有取得 userUid 才進行 API 呼叫
      if (!userUid) {
        alert("無法取得使用者ID，請確認 localStorage 是否已儲存 user_uid。");
        return;
      }

      if (!userMessage.trim()) {
        alert("請先輸入訊息");
        return;
      }

      setIsSending(true);

      // 1. 呼叫後端 API 建立新的對話
      const data = await createConversation(userUid);

      // 2. 從後端回傳資料中取得 conversation_uid
      const conversation_uid = data?.data?.conversation_uid;

      // 3. 將使用者輸入的訊息暫存到 localStorage(才有對話生成)
      localStorage.setItem(`init_msg_${conversation_uid}`, userMessage);

      // 4. 觸發 updateConversationList，通知 RootSidebar 更新
      window.dispatchEvent(new Event("updateConversationList"));

      // 5. 導航頁面到 /conversation/[conversation_uid]
      router.push(`/conversation/${conversation_uid}`);

      // 6. 十秒後再次觸發 updateConversationList，通知 RootSidebar 更新
      setTimeout(() => {
        window.dispatchEvent(new Event("updateConversationList"));
      }, 10000);
    } catch (error) {
      console.error("Create conversation error:", error);
      alert("建立對話失敗，請稍後再試。");
    } finally {
      setIsSending(false);
    }
  };

  // 按 Enter (非 Shift+Enter) 送出
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // 外層不置中，Header 置頂；內容區再做置中
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header 固定在畫面上方並佔滿寬度 */}
      <div className="sticky top-0 z-50 w-full">
        <ConversationHeader />
      </div>

      {/* 內容置中 */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* 標題區塊（不要背景色） */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-1">
              ITRI Intent-Based Chatbot
            </h1>
            <p className="text-sm text-muted-foreground">
              你可以在此輸入第一則訊息，然後系統會為你建立新的對話。
            </p>
          </div>

          {/* 輸入與送出區塊（有 bg-muted） */}
          <div className="py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="在這裡輸入訊息，按 Enter 即可送出 (Shift+Enter換行)"
              className="min-h-[140px] bg-muted px-3 py-2 text-sm leading-6 resize-y overflow-auto focus-visible:outline-none rounded-2xl"
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />

            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={!userMessage.trim() || isSending}
                className="rounded-xl px-3 py-2 h-fit mt-2 mr-2"
              >
                →
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
