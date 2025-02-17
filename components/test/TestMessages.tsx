"use client";

import React, { useEffect, useRef } from "react";
import TestMessageBubble from "./TestMessageBubble";

export default function TestMessages({ chatMessages, typingMessage }) {
  const containerRef = useRef(null);

  // 每次訊息更新後，自動捲到底部
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [chatMessages, typingMessage]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 py-4">
      <div className="mx-auto max-w-3xl flex flex-col gap-3">
        {chatMessages.map((msg) => (
          <TestMessageBubble key={msg.id} msg={msg} />
        ))}

        {typingMessage && <TestMessageBubble msg={typingMessage} isTyping />}
      </div>
    </div>
  );
}
