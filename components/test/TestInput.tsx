"use client";

import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Props:
 * - inputValue: 當前輸入框的值
 * - onChange: 更新父層 state
 * - onSend: 送出訊息動作
 * - isLoading: 是否正在載入歷史對話
 * - isSending: 是否正在生成回覆
 */

export default function TestInput({ inputValue, onChange, onSend, isLoading, isSending }) {
  return (
    <div className="w-1/2 mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted">
      {/* 上半部：多行輸入框 —— 修改 disabled 屬性 */}
      <textarea
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isSending ? "Assistant 正在輸出中…" : "Type message..."}
        className="
          flex-1 bg-muted px-3 py-2 text-sm leading-6
          resize-y overflow-auto focus-visible:outline-none
        "
        // 只要 isDisabled，就完全禁止 Enter 送出；但可繼續打字與 Shift+Enter 換行
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
