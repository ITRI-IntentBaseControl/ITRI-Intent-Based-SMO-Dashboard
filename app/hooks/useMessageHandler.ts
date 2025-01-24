// app/hooks/useMessageHandler.ts
"use client";

import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";

interface UseMessageHandlerOptions {
  brokerUrl: string; // "ws://..."
  initialTopic?: string; // 初始要訂閱的 topic (可選)
}

/**
 * 自訂 Hook: 負責 MQTT 連線、手動訂閱 topic、維護訊息列表
 */
export function useMessageHandler({
  brokerUrl,
  initialTopic,
}: UseMessageHandlerOptions) {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string | null>(
    initialTopic || null
  );
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  // 1. 在元件掛載時先連線，無論有沒有 topic
  useEffect(() => {
    const client = mqtt.connect(brokerUrl);
    clientRef.current = client;

    client.on("connect", () => {
      // 如果有初始 topic，就訂閱
      if (currentTopic) {
        client.subscribe(currentTopic, (err) => {
          if (err) console.error("Subscribe error:", err);
        });
      }
    });

    client.on("message", (receivedTopic, payload) => {
      if (receivedTopic === currentTopic) {
        setMessages([payload.toString()]);
      }
    });

    return () => {
      client.end(true);
    };
  }, [brokerUrl, currentTopic]);

  // 2. 手動訂閱新的 topic
  const subscribeTopic = (newTopic: string) => {
    const c = clientRef.current;
    if (!c) return; // 若此時連線還沒建立完成，或還沒連上
    // 若有舊 topic，退訂
    if (currentTopic) {
      c.unsubscribe(currentTopic);
    }
    // 訂閱新 topic
    c.subscribe(newTopic, (err) => {
      //   if (err) console.error("Subscribe error:", err);
    });
    setCurrentTopic(newTopic);
  };

  return {
    messages,
    subscribeTopic,
    currentTopic,
  };
}
