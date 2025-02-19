"use client";
import React from "react";

interface TextContent {
  type: "text";
  content: string;
}

interface TableContent {
  type: "table";
  content: {
    headers: string[];
    rows: string[][];
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

type DynamicContent = TextContent | TableContent | OptionContent;

interface ReaderDynamicContentProps {
  data: DynamicContent[];
  onSelectOption?: (label: string) => void;
}

export function ReaderDynamicContent({
  data,
  onSelectOption,
}: ReaderDynamicContentProps) {
  console.log("ReaderDynamicContent", data);

  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        switch (item.type) {
          // 文本
          case "text":
            return (
              <div key={idx} className="p-3 border rounded">
                <p className="text-gray-800">{item.content}</p>
              </div>
            );

          // 表格
          case "table":
            return (
              <table
                key={idx}
                className="w-full border border-collapse border-gray-300"
              >
                <thead className="bg-gray-200">
                  <tr>
                    {item.content.headers.map((header, hIdx) => (
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
                  {item.content.rows.map((row, rIdx) => (
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
            // 任何未知的型態都可以進到這個 default
            return (
              <div key={idx} className="p-3 border rounded text-red-500">
                無法識別的類型：{(item as any).type}
              </div>
            );
        }
      })}
    </div>
  );
}
