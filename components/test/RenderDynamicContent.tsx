"use client";
import React, { useState } from "react";

/**
 * ---------- 型別定義 ----------
 * 有時後端把 text.content 回傳成 JSON 物件而不是字串；
 * 所以 TextContent 的 content 改成 string | Record<string, unknown>
 */
interface TextContent {
  type: "text";
  content: string | Record<string, unknown>;
}

interface TableContent {
  type: "table";
  content: {
    columns: string[];
    data: string[][];
  };
}

interface OptionContent {
  type: "option";
  content: {
    choices: {
      id: string;
      label: string;
    }[];
  };
}

interface ImageContent {
  type: "image";
  content: string; // base64
}

// 所有可能內容
type DynamicContent = TextContent | TableContent | OptionContent | ImageContent;

interface ReaderDynamicContentProps {
  data: DynamicContent[];
  onSelectOption?: (label: string) => void;
}

export function ReaderDynamicContent({
  data,
  onSelectOption,
}: ReaderDynamicContentProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // 用於記錄每個表格是否處於「展開」狀態（true=展開, false=收起）
  const [expandedTables, setExpandedTables] = useState<boolean[]>(
    Array(data.length).fill(false)
  );

  /**
   * 將未知型別的 item.content 轉成顯示用字串
   * - 如果已是 string → 直接回傳
   * - 如果是物件 → JSON.stringify + prettify
   * - 其他型別 (number / boolean) → String()
   */
  const normalizeToString = (value: unknown): string => {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2); // 換行 + 縮排 2 空格，閱讀友好
    } catch {
      return String(value);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedTables((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };
  return (
    <>
      {/* 主要程式碼 */}
      <div className="space-y-4">
        {data.map((item, idx) => {
          switch (item.type) {
            // 表格
            case "table": {
              const tableData = item.content;
              const rowCount = tableData.data?.length || 0;
              const isExpanded = expandedTables[idx];

              // 若 rowCount > 10 且尚未展開，僅顯示前 10 筆
              const displayedRows = isExpanded
                ? tableData.data
                : tableData.data.slice(0, 10);

              return (
                <div key={idx} className="border rounded p-2">
                  <table className="w-full border border-collapse border-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        {tableData.columns?.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            className="border border-gray-300 px-2 py-1 text-left text-black"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="border border-gray-300 px-2 py-1"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* 若資料筆數超過 10 筆，就顯示按鈕進行展開 / 收起 */}
                  {rowCount > 10 && (
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="px-3 py-1 border rounded hover:bg-gray-100"
                      >
                        {isExpanded ? "收起" : "顯示全部"}
                      </button>
                    </div>
                  )}
                </div>
              );
            }
              //圖片
            case "image":
              return (
                <div
                  key={idx}
                  className="p-3 border rounded cursor-pointer"
                  onClick={() => setSelectedImage(item.content)}
                >
                  <img
                    src={`data:image/png;base64,${item.content}`}
                    alt={`image-${idx}`}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              );

            /* ----------------- OPTION ---------------- */
            case "option":
              return (
                <div key={idx} className="p-3 border rounded">
                  <p className="mb-2 font-semibold">請選擇：</p>
                  <div className="flex gap-2 flex-wrap">
                    {item.content.choices.map((choice) => (
                      <button
                        key={choice.id}
                        className="px-3 py-1 border rounded hover:bg-gray-100"
                        onClick={() => onSelectOption?.(choice.label)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              );

            /* ----------------- TEXT (or 其他) -------- */
            default: {
              const text = normalizeToString(item.content);
              return (
                <div key={idx} className="">
                  {/* 使用 white-space-pre-wrap 保留換行 */}
                  <p className="text-white whitespace-pre-wrap break-words">
                    {text}
                  </p>
                </div>
              );
            }
          }
        })}
      </div>

      {/* Modal 點擊放大圖片 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl w-full p-4">
            <img
              src={`data:image/png;base64,${selectedImage}`}
              alt="fullscreen"
              className="w-full h-auto rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="mt-4 text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              onClick={() => setSelectedImage(null)}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </>
  );
}
