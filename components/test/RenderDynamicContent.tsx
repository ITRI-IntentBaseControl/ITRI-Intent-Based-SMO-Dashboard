// RenderDynamicContent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { splitMarkdownBlocks, Detected } from "./markdown-detector";

interface RawItem {
  type?: "image" | "message";
  content: string;
}

interface Props {
  data: RawItem[];
  onSelectOption?: (...args: any[]) => void;
}

export function RenderDynamicContent({ data }: Props) {
  // 1. 拆塊：圖片 vs. Markdown/code/table
  const normalize = (input: unknown) =>
    typeof input === "string"
      ? input.replace(/\\n/g, "\n").replace(/\\r/g, "")
      : JSON.stringify(input, null, 2);

  const blocks: Detected[] = data
    .flatMap((d) => {
      const raw = normalize(d.content);
      const isImg =
        d.type === "image" || /^data:image\/\w+;base64,/.test(raw.trim());
      if (isImg) {
        return [{ type: "image", content: raw }];
      }
      return splitMarkdownBlocks(raw);
    })
    .filter((b) => !(b.type === "markdown" && !b.content.trim()));

  // 2. 圖片 Modal
  const [img, setImg] = useState<string | null>(null);

  // 3. 表格展開狀態
  const [expanded, setExpanded] = useState<boolean[]>([]);
  useEffect(() => {
    setExpanded(Array(blocks.length).fill(false));
  }, [data]);
  const toggle = (i: number) =>
    setExpanded((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  // 4. Inline 解析: 處理 **bold** 與純文字
  function parseInline(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((seg, i) => {
      const m = seg.match(/^\*\*(.+)\*\*$/);
      if (m) return <strong key={i}>{m[1]}</strong>;
      return <React.Fragment key={i}>{seg}</React.Fragment>;
    });
  }

  // 5. 自製 Markdown Block
  function MarkdownBlock({ content }: { content: string }) {
    const lines = content.split("\n");
    const elems: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (!listItems.length) return;
      const Tag = listType === "ol" ? "ol" : "ul";
      elems.push(
        <Tag key={elems.length} className="list-inside mb-4">
          {listItems}
        </Tag>
      );
      listItems = [];
      listType = null;
    };

    lines.forEach((rawLine, idx) => {
      // 檢測標題
      const trimmed = rawLine.trim();
      const head = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (head) {
        flushList();
        const level = head[1].length;
        const Tag = `h${level}` as unknown as keyof JSX.IntrinsicElements;
        const size =
          level === 1
            ? "text-2xl"
            : level === 2
            ? "text-xl"
            : level === 3
            ? "text-lg"
            : "text-base";
        elems.push(
          <Tag key={idx} className={`font-bold mt-4 mb-2 ${size} text-white`}>
            {head[2]}
          </Tag>
        );
        return;
      }

      // 檢測無序清單符號 - 或 *
      if (/^[-*]\s+/.test(trimmed)) {
        listType = "ul";
        listItems.push(
          <li key={idx} className="mb-1 text-white">
            {parseInline(trimmed.replace(/^[-*]\s+/, ""))}
          </li>
        );
        return;
      }

      // 檢測有序清單 1. 2.
      if (/^\d+\.\s+/.test(trimmed)) {
        listType = "ol";
        listItems.push(
          <li key={idx} className="mb-1 text-white">
            {parseInline(trimmed.replace(/^\d+\.\s+/, ""))}
          </li>
        );
        return;
      }

      // 檢測 Tab 縮排，自動轉成無序列表
      const tabMatch = rawLine.match(/^(\t+)(.*)$/);
      if (tabMatch) {
        const level = tabMatch[1].length;
        listType = "ul";
        listItems.push(
          <li
            key={idx}
            className="mb-1 text-white"
            style={{ marginLeft: `${level * 1}rem` }}
          >
            {parseInline(tabMatch[2].trim())}
          </li>
        );
        return;
      }

      // 普通段落
      flushList();
      if (trimmed) {
        elems.push(
          <p key={idx} className="mb-4 text-white">
            {parseInline(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return <>{elems}</>;
  }

  // 6. 最終 渲染
  return (
    <div className="bg-zinc-900 rounded-lg border p-4">
      {blocks.map((blk, i) => {
        switch (blk.type) {
          case "table": {
            const { columns, data: rows } = blk.content;
            const show = expanded[i] ? rows : rows.slice(0, 10);
            return (
              <div key={i} className="border rounded p-2 overflow-x-auto mb-4">
                <table className="w-full border-collapse text-white">
                  <thead className="bg-slate-600">
                    <tr>
                      {columns.map((c, j) => (
                        <th key={j} className="px-2 py-1">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {show.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className="border px-2 py-1">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <button
                    onClick={() => toggle(i)}
                    className="mt-2 px-3 py-1 border rounded text-sm bg-primary hover:bg-primary-foreground text-primary-foreground"
                  >
                    {expanded[i] ? "收起" : "顯示全部"}
                  </button>
                )}
              </div>
            );
          }

          case "code":
            return (
              <pre
                key={i}
                className="bg-[#1e1e1e] text-white p-3 rounded overflow-x-auto mb-4"
              >
                <code>{blk.content}</code>
              </pre>
            );

          case "image": {
            const src = blk.content.startsWith("data:image")
              ? blk.content
              : `data:image/png;base64,${blk.content}`;
            return (
              <div
                key={i}
                className="p-3 border rounded cursor-pointer mb-4"
                onClick={() => setImg(src)}
              >
                <img
                  src={src}
                  alt={`image-${i}`}
                  className="max-w-full h-auto rounded"
                />
              </div>
            );
          }

          case "markdown":
            return <MarkdownBlock key={i} content={blk.content} />;

          default:
            return null;
        }
      })}

      {img && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setImg(null)}
        >
          <img
            src={img}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
