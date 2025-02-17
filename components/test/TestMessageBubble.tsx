"use client";

import React from "react";
import TestRenderMessage from "./TestRenderMessage";

export default function TestMessageBubble({ msg, isTyping = false }) {
  const isUser = msg.role === "user";

  // 外層容器：User 靠右，Assistant 靠左
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      {/* 若想用 shadcn Card 包覆，也可以 */}
      {/* <Card className="max-w-[80%] p-2 rounded-lg"> */}
      <div
        className={`
          max-w-[80%]
          rounded-md
          p-2
          ${isUser ? "bg-primary/10" : "bg-secondary/10"}
        `}
      >
        {/* RenderMessage: 根據 type 渲染文字/表格/圖片/CSV */}
        <TestRenderMessage msg={msg} />
        {isTyping && (
          <span className="text-xs text-muted-foreground">正在輸入...</span>
        )}
      </div>
      {/* </Card> */}
    </div>
  );
}
