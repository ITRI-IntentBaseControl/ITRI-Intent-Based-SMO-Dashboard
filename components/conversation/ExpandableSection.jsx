"use client";

import { useState } from "react";

export function ExpandableSection({ title, data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pb-2">
      {/* 可展開的標題按鈕 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full font-medium text-left"
      >
        <span className="text-gray-500">{isExpanded ? "▸" : "▾"}</span>
        {title}
      </button>

      {/* 內部內容 (根據 isExpanded 控制顯示) */}
      {isExpanded && (
        <ul className="ml-4 mt-2 list-disc">
          {Object.entries(data).map(([key, value]) => (
            <li key={key} className="text-gray-600">
              <span className="font-semibold">{key}:</span> {value.toString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
