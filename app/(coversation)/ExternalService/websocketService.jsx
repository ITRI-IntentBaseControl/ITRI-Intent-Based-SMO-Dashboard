// 檔案路徑: /ExternalService/websocketService.js
"use client";

/**
 * 建立 WebSocket 服務，回傳一個控制物件
 *
 * @param {string} url WebSocket連線網址
 * @param {function} onOpen    - WebSocket onopen callback
 * @param {function} onMessage - WebSocket onmessage callback
 * @param {function} onError   - WebSocket onerror callback
 * @param {function} onClose   - WebSocket onclose callback
 * @returns {object} { socket, send, close }
 */
export function createWebSocketService({
  url,
  onOpen,
  onMessage,
  onError,
  onClose,
}) {
  const socket = new WebSocket(url);

  // WebSocket 事件綁定
  socket.onopen = onOpen;
  socket.onmessage = onMessage;
  socket.onerror = onError;
  socket.onclose = onClose;

  // 發送訊息
  function send(data) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.error("[WebSocket] not connected or not open.");
    }
  }

  // 關閉連線
  function close() {
    socket.close();
  }

  return { socket, send, close };
}
