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
    <div className="w-1/2 mx-auto py-4">
      <div className="flex gap-2">
        <textarea
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type message..."
          className="
            flex-1
            rounded-2xl
            border
            border-border
            bg-muted
            px-3
            py-2
            text-sm
            leading-6
            placeholder:text-muted-foreground
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            resize-y
            overflow-auto
          "
          // 關鍵處：監聽按鍵
          onKeyDown={(e) => {
            // 若按下 Enter，且沒按 Shift，則呼叫 onSend
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // 阻止換行
              onSend();
            }
          }}
        />
        <Button
          onClick={onSend}
          disabled={isLoading}
          className="
            rounded-xl 
            px-4 
            py-2 
            h-fit
          "
        >
          {isLoading ? "Sending..." : "Enter"}
        </Button>
      </div>
    </div>
  );
}
