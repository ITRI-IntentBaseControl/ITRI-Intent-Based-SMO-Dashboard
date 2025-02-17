"use client";

import React from "react";
// 匯入 shadcn 的 Button (請確保該元件已安裝/設定好)
import { Button } from "@/components/ui/button";

export default function TestRenderMessage({ msg }) {
  const { type, content, css = {} } = msg;

  switch (type) {
    case "text":
      return (
        <div className={css.container}>
          <p className={css.text}>{content}</p>
        </div>
      );

    case "table":
      return (
        <div className={css.container}>
          <table className={css.table}>
            <thead className={css.thead}>
              <tr>
                {content.headers.map((header, idx) => (
                  <th key={idx} className={css.th}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={css.tbody}>
              {content.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className={css.td}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <div className={css.container}>
          <img className={css.img} src={content.url} alt={content.alt} />
        </div>
      );

    case "file":
      return (
        <div className={css.container}>
          <a href={content.downloadUrl} download={content.fileName}>
            {/* 若想直接用 shadcn Button */}
            <Button variant="default" className={css.downloadButton}>
              下載 {content.fileName}
            </Button>
          </a>
        </div>
      );

    default:
      return null;
  }
}
