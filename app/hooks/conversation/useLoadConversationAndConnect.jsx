// useLoadConversationAndConnect.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getConversationHistory } from "../../service/conversation/ExternalService/apiService";
import { createWebSocketService } from "../../service/conversation/ExternalService/websocketService";

/**
 *
 * @param {string} conversationId
 * @param {function} onMessage - 不再放在依賴陣列裡，而是用 ref 讀取
 */
export function useLoadConversationAndConnect(conversationId, onMessage) {
  const router = useRouter();
  const wsServiceRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const HOST = process.env.HOST;
  const API_PORT = process.env.API_PORT;
  // 每次 render 都更新 ref 的 current，以保持最新 callback
  onMessageRef.current = onMessage;

  const [isLoading, setIsLoading] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);

        // 1) 載入歷史
        const res = await getConversationHistory(conversationId);
        if (mounted && res.status === true && Array.isArray(res.data)) {
          onMessageRef.current({ type: "history", data: res.data });
        }
        // 2) 建立 WebSocket 連線
        const wsUrl = `ws://${HOST}:${API_PORT}/ws/conversation/${conversationId}`;
        const service = createWebSocketService({
          url: wsUrl,
          onOpen: () => {
            setIsWsConnected(true);
            onMessageRef.current({ type: "ws-open" });
          },
          onMessage: (evt) => {
            onMessageRef.current({ type: "ws-message", data: evt.data });
          },
          onError: (err) => {
            console.error("[WebSocket] error:", err);
          },
          onClose: () => {
            setIsWsConnected(false);
          },
        });
        wsServiceRef.current = service;
      } catch (err) {
        console.error("[useLoadConversationAndConnect] init error:", err);
        if (mounted) {
          router.push("/");
          router.refresh();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (wsServiceRef.current) {
        wsServiceRef.current.close();
      }
    };
    // 這裡不放 onMessage
  }, [conversationId, router]);

  return {
    isLoading,
    isWsConnected,
    wsServiceRef,
  };
}
