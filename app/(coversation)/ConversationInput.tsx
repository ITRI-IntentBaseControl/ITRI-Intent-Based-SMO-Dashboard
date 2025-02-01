"use client";

import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Props:
 * - inputValue: 當前輸入框的值
 * - onChange: 更新父層 state
 * - onSend: 送出訊息動作
 * - isLoading: 是否正在送出中
 */
interface ConversationInputProps {
  inputValue: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ConversationInput({
  inputValue,
  onChange,
  onSend,
  isLoading,
}: ConversationInputProps) {
  return (
    <div className="w-1/2 mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted">
      {/* 上半部：多行輸入框 */}
      <textarea
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type message..."
        className="
          flex-1
          bg-muted
          px-3
          py-2
          text-sm
          leading-6
          resize-y
          overflow-auto

          focus-visible:outline-none
        "
        // 按 Enter 送出，Shift+Enter 換行
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />

      {/* 下半部：右側箭頭按鈕 */}
      <div className="flex justify-end">
        <Button
          onClick={onSend}
          disabled={isLoading}
          className="
            rounded-xl
            px-3
            py-2
            h-fit
            mt-2
            mr-2
          "
        >
          {isLoading ? "Sending..." : "→"}
        </Button>
      </div>
    </div>
  );
}
