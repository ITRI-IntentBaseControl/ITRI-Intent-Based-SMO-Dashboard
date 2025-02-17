"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function TestInput({ inputValue, onChange, onSend, isLoading }) {
  // Enter (不按 Shift) 直接送出
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border p-4 bg-muted">
      <div className="flex flex-col gap-2 max-w-3xl mx-auto">
        <textarea
          rows={2}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="
            w-full
            resize-none 
            border border-input 
            rounded-md 
            bg-background
            px-3 py-2 
            text-sm 
            focus-visible:outline-none
          "
          placeholder="輸入訊息...(Enter 送出, Shift+Enter 換行)"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button onClick={onSend} disabled={isLoading}>
            {isLoading ? "送出中..." : "送出"}
          </Button>
        </div>
      </div>
    </div>
  );
}
