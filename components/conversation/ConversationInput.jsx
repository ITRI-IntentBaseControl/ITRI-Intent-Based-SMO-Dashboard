"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export function ConversationInput({
  inputValue,
  onChange,
  onSend,
  isLoading,
  isSending = false, // true = 仍可打字，但禁止送出
}) {
  return (
    <div className="w-auto mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted">
      {/* 上半部：多行輸入框 —— 修改 disabled 屬性 */}
      <textarea
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isSending ? "Assistant 正在輸出中…" : "Type message..."}
        className="
          flex-1 bg-muted px-3 py-2 text-sm leading-6
          resize-y overflow-auto focus-visible:outline-none
        "
        // 只要 isSending，就完全禁止 Enter 送出；但可繼續打字與 Shift+Enter 換行
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isSending && inputValue.trim() !== "") {
              onSend(inputValue);
            }
          }
        }}
      />

      {/* 下半部：送出按鈕 —— 仍照 isSending 鎖住 */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (isSending || inputValue.trim() === "") return;
            onSend(inputValue);
          }}
          disabled={isLoading || !inputValue.trim() || isSending}
          className="rounded-xl px-3 py-2 h-fit mt-2 mr-2"
        >
          {isLoading ? "Sending..." : "→"}
        </Button>
      </div>
    </div>
  );
}
