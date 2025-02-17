"use client";

import React from "react";
import TestClient from "@/components/test/TestClient";

// 直接硬编码假資料
const mockMessages = [
  {
    id: "msg-1",
    role: "assistant",
    type: "text",
    content: "歡迎使用測試對話系統！請問有什麼可以幫您？",
    timestamp: "2025-02-16T10:00:00Z",
    css: {
      container: "mb-2 p-3 bg-gray-50 rounded-md",
      text: "text-sm text-gray-900",
    },
  },
  {
    id: "msg-2",
    role: "user",
    type: "text",
    content: "可以幫我顯示一個表格和一張圖片嗎？",
    timestamp: "2025-02-16T10:01:00Z",
    css: {
      container: "mb-2 p-3 bg-blue-50 rounded-md",
      text: "text-sm text-gray-900",
    },
  },
  {
    id: "msg-3",
    role: "assistant",
    type: "table",
    content: {
      headers: ["商品名稱", "單價", "數量", "小計"],
      rows: [
        ["蘋果", "NT$30", "5", "NT$150"],
        ["香蕉", "NT$10", "10", "NT$100"],
        ["橘子", "NT$20", "2", "NT$40"],
      ],
    },
    timestamp: "2025-02-16T10:02:00Z",
    css: {
      container: "mt-2 mb-3 border border-gray-200 rounded-md overflow-auto",
      table: "w-full border-collapse text-sm",
      thead: "bg-gray-100 text-gray-700",
      th: "p-2 border-b border-gray-200 text-left font-medium",
      tbody: "",
      td: "p-2 border-b border-gray-100",
    },
  },
  {
    id: "msg-4",
    role: "assistant",
    type: "image",
    content: {
      url: "./images.png",
      alt: "可愛的貓咪示意圖",
    },
    timestamp: "2025-02-16T10:02:30Z",
    css: {
      container: "mt-3 mb-3 rounded-md overflow-hidden flex justify-center",
      img: "object-cover rounded-md w-full h-auto max-w-sm shadow",
    },
  },
  {
    id: "msg-5",
    role: "user",
    type: "text",
    content: "可以給我一個 CSV 檔連結嗎？",
    timestamp: "2025-02-16T10:03:00Z",
    css: {
      container: "mb-3 p-3 bg-blue-50 rounded-md",
      text: "text-sm text-gray-900",
    },
  },
  {
    id: "msg-6",
    role: "assistant",
    type: "file",
    content: {
      fileType: "csv",
      fileName: "example-data.csv",
      downloadUrl: "https://example.com/api/fake-csv-download",
    },
    timestamp: "2025-02-16T10:04:00Z",
    css: {
      container: "mt-2 mb-3",
      downloadButton:
        // 這邊示範 shadcn Button 樣式 (primary variant)
        "inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md focus:outline-none",
    },
  },
];

export default function TestPage() {
  return (
    <TestClient
      // 將上述假資料傳給 Client
      initialMessages={mockMessages}
      defaultUserInput=""
    />
  );
}
