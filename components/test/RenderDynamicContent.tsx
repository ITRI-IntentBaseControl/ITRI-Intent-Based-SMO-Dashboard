"use client";
import React from "react";

//1.定義資料結構
interface MessageContent {
  type: "message";
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
    text: string;
    choices: {
      id: number;
      label: string;
    }[];
  };
}

type DynamicContent = MessageContent | TableContent | OptionContent;

interface ReaderDynamicContentProps {
  //接收陣列，每個元素都可能是message、table、option
  data: DynamicContent[];
  onSelectOption?: (label: string) => void;
}

export function ReaderDynamicContent({
  data,
  onSelectOption,
}: ReaderDynamicContentProps) {

  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        //根據不同type渲染
        switch (item.type) {
          case "message":
            return (
              <div key={idx} className="p-3 border rounded">
                <p className="text-gray-800">{item.content}</p>
              </div>
            );

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

          case "option":
            return (
              <div key={idx} className="p-3 border rounded">
                <p className="mb-2 font-semibold"> {item.content.text}</p>
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
