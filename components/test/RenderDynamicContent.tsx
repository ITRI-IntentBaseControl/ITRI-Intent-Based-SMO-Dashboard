"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitMarkdownBlocks, Detected } from "./markdown-detector";

interface RawItem {
  type?: "image" | "message";
  content: string;
}

interface Props {
  data: RawItem[];
}

export function ReaderDynamicContent({ data }: Props) {
  console.log("input data:", data);
  /* ---------- 1. 把每段 Markdown 字串拆塊並攤平成一維陣列 ---------- */
  const normalize = (input: unknown): string =>
    typeof input === "string"
      ? input.replace(/\\n/g, "\n").replace(/\\r/g, "")
      : JSON.stringify(input, null, 2); // 把物件安全轉成字串

  // ⭐ 先判斷是不是圖片；只有不是圖片才進 splitMarkdownBlocks
  const blocks: Detected[] = data.flatMap((d) => {
    const raw = d.content;

    /* 判斷圖片 */
    const isImg =
      d.type === "image" ||
      typeof raw === "object" ||
      /^data:image\/\w+;base64,/.test(String(raw).trim());

    if (isImg) {
      // ⇢ 1) 若是 n8n 的 {data:{data:"base64…"}} 結構就取最深層
      const base64 =
        typeof raw === "string" ? raw : raw?.data?.data ?? raw?.data ?? "";

      return [{ type: "image", content: base64 }];
    }

    /* 文字／Markdown 走舊邏輯 */
    return splitMarkdownBlocks(normalize(String(raw)));
  });
  const safeBlocks = blocks.filter(
    (b) => !(b.type === "markdown" && !b.content.trim())
  );
  console.log("safeBlocks:", safeBlocks);
  /* ---------- 2. 圖片 Modal ---------- */
  const [img, setImg] = useState<string | null>(null);

  /* ---------- 3. 表格展開狀態 ---------- */
  const [expanded, setEx] = useState<boolean[]>([]);
  useEffect(() => setEx(Array(blocks.length).fill(false)), [data]);

  const toggle = (i: number) =>
    setEx((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  /* ---------- 4. 渲染函式 ---------- */
  const render = (blk: Detected, i: number) => {
    switch (blk.type) {
      case "markdown":
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} className="">
            {blk.content}
          </ReactMarkdown>
        );

      case "table": {
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
                className="mt-1 px-2 py-0.5 border rounded text-sm"
                onClick={() => toggle(i)}
              >
                {expanded[i] ? "收起" : "顯示全部"}
              </button>
            )}
          </div>
        );
      }

      case "image": {
        const src = blk.content.startsWith("data:image")
          ? blk.content
          : `data:image/png;base64,${blk.content}`; // ★ 補 data URI 前綴

        return (
          <div
            key={i} // ★ 移除屬性列裡的註解
            className="p-3 border rounded cursor-pointer"
            onClick={() => setImg(src)} // ★ 用 setImg 開 modal
          >
            <img
              src={src}
              alt={`image-${i}`}
              className="max-w-full h-auto rounded"
            />
          </div>
        );
      }

      case "code":
        return (
          <pre
            key={i}
            className="bg-[#1e1e1e] text-green-200 p-3 rounded overflow-x-auto"
          >
            <code>{blk.content}</code>
          </pre>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="">{safeBlocks.map(render)}</div>

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
    </>
  );
}
