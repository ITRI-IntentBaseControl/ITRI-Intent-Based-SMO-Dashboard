"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitMarkdownBlocks, Detected } from "./markdown-detector";
import { useTypewriter } from "@/app/service/conversation/InternalService/useTypewriter";

interface RawItem {
  type?: "image" | "message";
  content: string;
}

interface Props {
  data: RawItem[];
  isTyping: boolean;
  onSelectOption?: (...args: any[]) => void;
}

export function RenderDynamicContent({ data }: Props) {
  // 1. 拆塊
  const normalize = (input: unknown) =>
    typeof input === "string"
      ? input.replace(/\\n/g, "\n").replace(/\\r/g, "")
      : JSON.stringify(input, null, 2);

  const blocks: Detected[] = data
    .flatMap((d) => {
      const raw = normalize(d.content);
      // 圖片判斷
      const isImg =
        d.type === "image" || /^data:image\/\w+;base64,/.test(raw.trim());

      if (isImg) {
        return [{ type: "image", content: raw }];
      }
      // 文字／Markdown
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

  // 4. **呼叫 useTypewriter** —— 一次呼叫對應每一個 block
  //    這樣即使 isTyping 切換，也不會改變 hook 次數與順序
  const typedBlocks = blocks.map((blk) =>
    useTypewriter(
      blk.type === "markdown" ? blk.content : "", // 只有文字 block 有意義，其他傳空字串
      40
    )
  );

  // 5. 渲染
  return (
    <div className="bg-zinc-900 rounded-lg border p-4">
      {blocks.map((blk, i) => {
        // table
        if (blk.type === "table") {
          const { columns, data: rows } = blk.content;
          const show = expanded[i] ? rows : rows.slice(0, 10);
          return (
            <div key={i} className="border rounded p-2 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-600 text-white">
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
                  className="mt-1 px-2 py-0.5 border rounded text-sm"
                >
                  {expanded[i] ? "收起" : "顯示全部"}
                </button>
              )}
            </div>
          );
        }

        // code
        if (blk.type === "code") {
          return (
            <pre
              key={i}
              className="bg-[#1e1e1e] text-green-200 p-3 rounded overflow-x-auto"
            >
              <code>{blk.content}</code>
            </pre>
          );
        }

        // image
        if (blk.type === "image") {
          const src = blk.content.startsWith("data:image")
            ? blk.content
            : `data:image/png;base64,${blk.content}`;
          return (
            <div
              key={i}
              className="p-3 border rounded cursor-pointer"
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

        // markdown 文字塊
        if (blk.type === "markdown") {
          const text = blk.content;
          const toShow = text;
          return (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} className="">
              {toShow}
            </ReactMarkdown>
          );
        }

        return null;
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
