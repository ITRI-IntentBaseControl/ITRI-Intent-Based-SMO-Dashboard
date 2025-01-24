"use client";

import React, { useEffect, useState } from "react";
import { useMessageHandler } from "@/app/hooks/useMessageHandler";
import { createConversation } from "@/app/api/conversation/route";
import { sendMessageAPI } from "@/app/api/message/route";

interface Props {
  conversationId?: string;
  initialMessages?: string[];
  brokerUrl: string;
}

export default function ConversationClient({
  conversationId: initialConvId,
  initialMessages = [],
  brokerUrl,
}: Props) {
  const [conversationId, setConversationId] = useState(initialConvId || null);
  const [topic, setTopic] = useState<string | null>(
    initialConvId ? `conversations/${initialConvId}` : null
  );
  const [inputValue, setInputValue] = useState("");

  // 使用自訂 Hook 做 MQTT 訊息訂閱
  const { messages, subscribeTopic } = useMessageHandler({
    brokerUrl,
    topic,
  });
  console.log("messages", messages);
  // 把 SSR 傳進來的 initialMessages 與 messages 結合
  const [allMessages, setAllMessages] = useState([...initialMessages]);

  // 每當 messages 有更新，就把它合併到 allMessages
  useEffect(() => {
    if (messages.length > 0) {
      setAllMessages((prev) => [...prev, ...messages]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // 建立對話
  const handleCreateConversation = async () => {
    try {
      const data = await createConversation();
      if (data?.conversationId && data?.topic) {
        setConversationId(data.conversationId);
        setTopic(data.topic);
        subscribeTopic(data.topic);
      }
    } catch (error) {
      console.error("Create conversation failed:", error);
    }
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!conversationId) {
      alert("請先建立會話");
      return;
    }
    try {
      const data = await sendMessageAPI(conversationId, inputValue);
      if (data.error) {
        alert(data.error);
      } else {
        setInputValue("");
        console.log("[Next.js] Message sent successfully");
      }
    } catch (error) {
      console.error("Send message failed:", error);
    }
  };

  return (
    <div style={{ width: "600px", margin: "0 auto", padding: "2rem" }}>
      <h1>Server + Client Example</h1>

      <div style={{ marginBottom: "1rem" }}>
        {!conversationId ? (
          <button onClick={handleCreateConversation}>建立新對話</button>
        ) : (
          <p>已建立會話 ID：{conversationId}</p>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="輸入訊息..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={handleSendMessage}>送出</button>
      </div>

      <div
        style={{ marginTop: "2rem", border: "1px solid #ccc", padding: "1rem" }}
      >
        <h2>對話紀錄 (含SSR初始訊息)</h2>
        {allMessages.map((msg, index) => (
          <div key={index} style={{ margin: "0.5rem 0" }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
