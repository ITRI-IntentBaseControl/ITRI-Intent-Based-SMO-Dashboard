"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "@/app/api/conversation/route";

export default function HomePage() {
  const router = useRouter();
  const [userMessage, setUserMessage] = useState("");

  // 當使用者在根路由輸入訊息後
  const handleSend = async () => {
    try {
      // 1. 假設你要先建立Conversation
      const data = await createConversation();
      // 後端回傳 { conversationId, topic }...
      const conversationId = data.conversationId;
      // 2. 轉跳到 conversation/[uid]
      router.push(
        `/conversation/${conversationId}?msg=${encodeURIComponent(userMessage)}`
      );
      // 可把使用者在此輸入的訊息帶到 QueryString (選擇性)
    } catch (error) {
      console.error("Create conversation error:", error);
    }
  };

  return (
    <main>
      <h1>根路由: 輸入訊息後建立/取得對話</h1>
      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="輸入第一則訊息..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        />
        <button onClick={handleSend}>送出</button>
      </div>
    </main>
  );
}
