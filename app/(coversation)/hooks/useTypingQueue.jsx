// useTypingEffect.js
"use client";

import { useEffect, useState } from "react";

export function useTypingEffect(initialPending = [], onComplete) {
  const [internalPending, setInternalPending] = useState(initialPending);
  const [typingMessage, setTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // 若外部 pendingMessages 變動，用函式或 useEffect 同步
  // (略) 省略過去示例，可依原本需求調整

  useEffect(() => {
    if (internalPending.length > 0 && !isTyping) {
      typeNextMessage();
    }
    // 僅依賴 internalPending.length + isTyping
  }, [internalPending.length, isTyping]);

  async function typeNextMessage() {
    if (internalPending.length === 0) return;
    setIsTyping(true);

    const [nextMsg, ...others] = internalPending;
    setInternalPending(others);

    setTypingMessage({ role: "llm", content: "Thinking..." });
    await new Promise((r) => setTimeout(r, 500));

    let partial = "";
    for (let i = 0; i < nextMsg.content.length; i++) {
      partial += nextMsg.content[i];
      setTypingMessage({ role: nextMsg.role, content: partial });
      await new Promise((r) => setTimeout(r, 10));
    }

    // 打完 → 通知外部
    if (onComplete) {
      onComplete(nextMsg);
    }

    // 重置
    setTypingMessage(null);
    setIsTyping(false);
  }

  function pushPendingMessage(msg) {
    setInternalPending((prev) => [...prev, msg]);
  }

  return {
    typingMessage,
    pushPendingMessage,
    isTyping,
  };
}
