"use client";
import React, { useState } from "react";

interface TextContent {
  type: "text";
  content: string;
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
  content: string; //base64
}

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

  return (
    <>
      {/*主要程式碼*/}
      <div className="space-y-4">
        {data.map((item, idx) => {
          switch (item.type) {
            // 表格
            case "table":
              // 1. 先把 item.content 從字串 -> 變成可用物件
              let tableData;
              try {
                // 把所有單引號 ' 轉成 "；如果後端剛好有正常雙引號，也需要確定不會衝突
                const validJsonString = item.content.replace(/'/g, '"');

                // 2. 解析為 JS 物件 (這裡根據你的例子，可能是一個陣列)
                const parsed = JSON.parse(validJsonString);

                // 如果後端總是回傳一個陣列，那就取第 0 個
                tableData = Array.isArray(parsed) ? parsed[0] : parsed;
              } catch (err) {
                console.error("Error parsing table JSON:", err);
                // 出錯就給個 fallback，避免整個崩潰
                tableData = { columns: [], data: [] };
              }

              // 3. 用 tableData 來渲染
              return (
                <table
                  key={idx}
                  className="w-full border border-collapse border-gray-300"
                >
                  <thead className="bg-gray-200">
                    <tr>
                      {tableData.columns?.map((header, hIdx) => (
                        <th
                          key={hIdx}
                          className="border border-gray-300 px-2 py-1 text-left"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.data?.map((row, rIdx) => (
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
              ); //圖片
            case "image":
              return (
                <div
                  key={idx}
                  className="p-3 border rounded"
                  onClick={() => setSelectedImage(item.content)}
                >
                  <img
                    src={`data:image/png;base64,${item.content}`}
                    alt={`image-${idx}`}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              );

            // 選項
            case "option":
              return (
                <div key={idx} className="p-3 border rounded">
                  <p className="mb-2 font-semibold">請選擇：</p>
                  <div className="flex gap-2">
                    {item.content.choices.map((choice) => (
                      <button
                        key={choice.id}
                        className="px-3 py-1 border rounded hover:bg-gray-100"
                        onClick={() => {
                          if (onSelectOption) {
                            onSelectOption(choice.label);
                          }
                        }}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              );

            default:
              // 任何未知的型態都可以進到這個 default (輸出文字)
              return (
                <div key={idx} className="">
                  <p className="text-white">{item.content}</p>
                </div>
              );
          }
        })}
      </div>

      {/*Modal點擊放大圖片*/}
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
