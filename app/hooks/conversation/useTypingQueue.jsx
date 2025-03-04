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

    setTypingMessage({ role: "llm", content: "Thinking..." });
    await delay(500);

    let typedText = "";
    for (let i = 0; i < nextMsg.text_content.length; i++) {
      const currentBlock = nextMsg.text_content[i];
      const blockContent = currentBlock.content;

      for (let c = 0; c < blockContent.length; c++) {
        typedText += blockContent[c];
        setTypingMessage({
          role: nextMsg.role,
          type: currentBlock.type,
          content: typedText,
        });
        await delay(10);
      }
      // 視需求，可在此加入段落之間的換行或其他處理
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

  return {
    typingMessage,
    pushPendingMessage,
    isTyping,
  };
}
