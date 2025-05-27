"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export function ConversationInput({
  inputValue,
  onChange,
  onSend,
  isLoading,
  isDisabled = false,   // true = 仍可打字，但禁止送出
}) {
  return (
    <div className="w-1/2 mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted">
      {/* 多行輸入框 —— 不再 disabled */}
      <textarea
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isDisabled ? "Assistant 正在輸出中…" : "Type message..."}
        className="
          flex-1 bg-muted px-3 py-2 text-sm leading-6
          resize-y overflow-auto focus-visible:outline-none
        "
        onKeyDown={(e) => {
          // 只要 isDisabled，就完全禁止 Enter 送出；但可繼續打字與 Shift+Enter 換行
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isDisabled && inputValue.trim() !== "") {
              onSend(inputValue);
            }
          }
        }}
      />

      {/* 送出按鈕 —— 仍照 isDisabled 鎖住 */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (isDisabled || inputValue.trim() === "") return;
            onSend(inputValue);
          }}
          disabled={isLoading || !inputValue.trim() || isDisabled}
          className="rounded-xl px-3 py-2 h-fit mt-2 mr-2"
        >
          {isLoading ? "Sending..." : "→"}
        </Button>
      </div>
    </div>
  );
}
