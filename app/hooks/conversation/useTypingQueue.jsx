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
    console.log(nextMsg);
    let partial = "";
    // 第一層：走訪 text_content 陣列
    for (let i = 0; i < nextMsg.text_content.length; i++) {
      const itemContent = nextMsg.text_content[i].content;
      // 第二層：針對 itemContent 的每個字元
      for (let c = 0; c < itemContent.length; c++) {
        partial += itemContent[c];
        setTypingMessage({
          role: nextMsg.role,
          type: nextMsg.text_content[i].type,
          content: partial,
        });
        await new Promise((r) => setTimeout(r, 10));
      }
      // 如果想在每段之間加入換行，可自行 partial += "\n"（視需求而定）
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
