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
      // 若 topic 符合 currentTopic，就把新訊息「累加」進 messages
      if (receivedTopic === currentTopic) {
        setMessages([payload.toString()]);
      }
    });

    // 結束時關閉連線
    return () => {
      client.end(true);
    };
  }, [brokerUrl, currentTopic]);

  /**
   * 2. 手動訂閱新的 topic (可多加 callback, 供訂閱完成後執行下一步)
   */
  const subscribeTopic = (newTopic: string, onSubscribed?: () => void) => {
    const c = clientRef.current;
    if (!c) return; // 若此時連線還沒建立完成

    // 若有舊 topic，先退訂
    if (currentTopic) {
      c.unsubscribe(currentTopic, (err) => {
        if (err) console.error("Unsubscribe error:", err);
      });
    }

    // 訂閱新 topic
    c.subscribe(newTopic, (err, granted) => {
      if (err) {
        // console.error("Subscribe error:", err);
      } else {
        if (onSubscribed) onSubscribed();
      }
    });

    setCurrentTopic(newTopic);

    // 若想清空舊訊息，可在此決定:
    // setMessages([]);
  };

  return {
    messages,
    subscribeTopic,
    currentTopic,
  };
}
