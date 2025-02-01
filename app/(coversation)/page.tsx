"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "@/app/api/conversation/route";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [userMessage, setUserMessage] = useState("");

  // 當使用者輸入訊息後
  const handleSend = async () => {
    try {
      // 1. 呼叫 API 來建立 Conversation
      const data = await createConversation();
      // 假設後端回傳 { conversationId, topic }...
      const conversationId = data.conversationId;

      // 2. 轉跳到 /conversation/[uid]，把使用者輸入的訊息帶入 QueryString (可自由決定要不要)
      router.push(
        `/conversation/${conversationId}?msg=${encodeURIComponent(userMessage)}`
      );
    } catch (error) {
      console.error("Create conversation error:", error);
      alert("建立對話失敗，請稍後再試。");
    }
  };

  // 也可支援按 Enter 直接送出
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* 標題與簡介 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">ITRI Intent Base Chatbot</h1>
        <p className="text-sm text-muted-foreground">
          你可以在此輸入第一則訊息，然後系統會為你建立新的對話。
        </p>
      </div>

      {/* 輸入區塊 (中間 50% 寬度) */}
      <div className="w-1/2 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="在這裡輸入訊息，按 Enter 即可送出 (Shift+Enter換行)"
            className="
              flex-1
              rounded-2xl
              border
              border-border
              bg-muted
              px-3
              py-2
              text-sm
              leading-6
              placeholder:text-muted-foreground
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              resize-y
              overflow-auto
            "
          />
          <Button
            onClick={handleSend}
            disabled={!userMessage.trim()}
            className="
              rounded-xl 
              px-4 
              py-2 
              h-fit
            "
          >
            送出
          </Button>
        </div>
      </div>
    </main>
  );
}
