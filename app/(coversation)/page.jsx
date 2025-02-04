"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "./service";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [userMessage, setUserMessage] = useState("");
  const [userUid, setUserUid] = useState(null);

  // 在元件載入時從 localStorage 抓取 user_uid
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserUid = localStorage.getItem("user_uid");
      setUserUid(storedUserUid);
    }
  }, []);

  // 當使用者輸入訊息後
  const handleSend = async () => {
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

      // 1. 呼叫後端 API 建立新的對話
      const data = await createConversation(userUid);

      // 從後端回傳資料中取得 conversation_uid
      const conversation_uid = data.data.conversation_uid;

      // 2. 將使用者輸入的訊息暫存到 localStorage
      localStorage.setItem(`init_msg_${conversation_uid}`, userMessage);

      // 3. 導頁到 /conversation/[conversation_uid]
      router.push(`/conversation/${conversation_uid}`);
    } catch (error) {
      console.error("Create conversation error:", error);
      alert("建立對話失敗，請稍後再試。");
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">ITRI Intent Base Chatbot</h1>
        <p className="text-sm text-muted-foreground">
          你可以在此輸入第一則訊息，然後系統會為你建立新的對話。
        </p>
      </div>

      <div className="w-1/2 mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted">
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="在這裡輸入訊息，按 Enter 即可送出 (Shift+Enter換行)"
          className="
            flex-1
            bg-muted
            px-3
            py-2
            text-sm
            leading-6
            resize-y
            overflow-auto
            focus-visible:outline-none
          "
          onKeyDown={handleKeyDown}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={!userMessage.trim()}
            className="
              rounded-xl
              px-3
              py-2
              h-fit
              mt-2
              mr-2
            "
          >
            →
          </Button>
        </div>
      </div>
    </main>
  );
}
