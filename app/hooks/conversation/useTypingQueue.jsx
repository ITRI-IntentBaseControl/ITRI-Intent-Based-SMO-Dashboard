// useTypingEffect.js
"use client";

import { useCallback, useEffect, useState } from "react";

export function useTypingEffect(initialMessage = [], onComplete) {
  const [messageQueue, setMessageQueue] = useState(initialMessage);
  const [typingMessage, setTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (messageQueue.length > 0 && !isTyping) {
      typeNextMessage();
    }
    // 僅依賴 internalPending.length + isTyping
  }, [messageQueue.length, isTyping]);

  const typeNextMessage = useCallback(async () => {
    if (!messageQueue.length) return;
    setIsTyping(true);

    const [nextMsg, ...remain] = messageQueue;
    setMessageQueue(remain);

    let typedText = "";
    for (let i = 0; i < nextMsg.text_content.length; i++) {
      const currentBlock = nextMsg.text_content[i];
      const blockContent = currentBlock.content;

      // 如果是圖片，不做打字迴圈，直接 setTypingMessage
      if (currentBlock.type === "image") {
        // 直接一次把整個 blockContent (可能是 base64 或 URL) 當作 content
        // 這裡可以依照你的需求改成對應顯示圖片的邏輯
        setTypingMessage({
          role: nextMsg.role,
          type: "image",
          content: blockContent,
        });
        // 可以視需求插個 delay(500) 等等，若想在圖片出現前稍微停頓
        continue;
      }

      // 否則就是文字 → 走打字效果
      for (let c = 0; c < blockContent.length; c++) {
        typedText += blockContent[c];
        setTypingMessage({
          role: nextMsg.role,
          type: currentBlock.type, // 應該是 "message"
          content: typedText,
        });
        await delay(10); // 這裡決定打字速度
      }
    }

    // 打完 → 通知外部
    if (onComplete) {
      onComplete(nextMsg);
    }

    // 重置
    setTypingMessage(null);
    setIsTyping(false);
  }, [messageQueue, onComplete]);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function pushPendingMessage(msg) {
    setMessageQueue((prev) => [...prev, msg]);
  }

  function showThinking() {
    setTypingMessage({
      role: "llm",
      type: "text",
      content: "Thinking...",
    });
  }

  function clearTypingMessage() {
    setTypingMessage(null);
  }
  return {
    typingMessage,
    pushPendingMessage,
    isTyping,
    showThinking,
    clearTypingMessage,
  };
}
