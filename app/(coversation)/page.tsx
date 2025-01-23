"use client";
// frontend/pages/index.tsx
import React, { useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

export default function HomePage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  console.log("Messages:", messages);
  useEffect(() => {
    const client = mqtt.connect("ws://localhost:30000");
    mqttClientRef.current = client;

    client.on("connect", () => {
      console.log("[Next.js] Connected to MQTT Broker via WebSocket");
    });

    client.on("message", (receivedTopic, payload) => {
      // 可以選擇判斷是否匹配當前 topic
      // if (receivedTopic === topic) { ... }
      setMessages((prev) => [...prev, payload.toString()]);
    });

    // cleanup
    return () => {
      client.end(true);
    };
  }, []);

  // 建立 Conversation，呼叫後端 /create-conversation
  const createConversation = async () => {
    const res = await fetch("http://localhost:3001/create-conversation", {
      method: "POST",
    });
    const data = await res.json();
    if (data.conversationId && data.topic) {
      setConversationId(data.conversationId);
      setTopic(data.topic);

      // 已經連上 Broker，直接訂閱新 topic
      mqttClientRef.current?.subscribe(data.topic, (err) => {
        if (err) {
          console.error("[Next.js] Subscription error:", err);
        } else {
          console.log("[Next.js] Subscribed to topic:", data.topic);
        }
      });
    }
  };
  // const switchTopic = (newTopic) => {
  //   // 退訂舊 topic
  //   if (topic && mqttClientRef.current) {
  //     mqttClientRef.current.unsubscribe(topic);
  //   }
  //   // 訂閱新 topic
  //   mqttClientRef.current?.subscribe(newTopic);
  //   setTopic(newTopic);
  // };
  // 發送訊息給後端 /send-message
  const sendMessage = async () => {
    // if (!conversationId) {
    //   alert("請先建立或載入會話");
    //   return;
    // }

    const res = await fetch("http://localhost:3001/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        userMessage: inputValue,
      }),
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      // 清空輸入框
      setInputValue("");
      console.log("[Next.js] Message sent successfully");
    }
  };

  return (
    <div style={{ width: "600px", margin: "0 auto", padding: "2rem" }}>
      <h1>LLM Chat Example</h1>
      <div style={{ marginBottom: "1rem" }}>
        {!conversationId ? (
          <button onClick={createConversation}>建立新對話</button>
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
        <button onClick={sendMessage}>送出</button>
      </div>

      <div
        style={{ marginTop: "2rem", border: "1px solid #ccc", padding: "1rem" }}
      >
        <h2>對話紀錄</h2>
        {messages.map((msg, index) => (
          <div key={index} style={{ margin: "0.5rem 0" }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
