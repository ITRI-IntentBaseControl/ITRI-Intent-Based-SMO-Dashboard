// RenderDynamicContent.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { splitMarkdownBlocks, Detected } from "./markdown-detector";
import { getImage } from "@/app/service/conversation/ExternalService/apiService";

interface RawItem {
  type?: "image" | "message";
  content: string;
}

interface Props {
  data: RawItem[];
  conversationId: string;
  onSelectOption?: (...args: any[]) => void;
}

interface ConversationImageBlockProps {
  i: number;
  conversationId: string;
  imageId: string;
  setImg: (url: string | null) => void;
}

const ConversationImageBlock: React.FC<ConversationImageBlockProps> = ({
  i,
  conversationId,
  imageId,
  setImg,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchAndSetImage = async () => {
      if (!conversationId || !imageId) {
        setError("Missing conversationId or imageId for image.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const imageBlob = await getImage(conversationId, imageId);
        if (imageBlob) {
          objectUrl = URL.createObjectURL(imageBlob);
          setImageUrl(objectUrl);
        } else {
          setError("Failed to retrieve image data.");
        }
      } catch (err: any) {
        console.error("Error fetching image in component:", err);
        setError(`Failed to load image: ${err.message || "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        // console.log(`Released Blob URL: ${objectUrl}`);
      }
    };
  }, [conversationId, imageId]);

  if (isLoading) {
    return (
      <div key={i} className="p-3 mb-4 text-center text-muted-foreground">
        Loading image...
      </div>
    );
  }

  if (error) {
    return (
      <div key={i} className="p-3 mb-4 text-center text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      key={i}
      className="p-3 mb-4 border border-border rounded bg-card text-card-foreground cursor-pointer hover:bg-accent transition-colors"
      onClick={() => setImg(imageUrl)}
    >
      <img
        src={imageUrl}
        alt={`image-${i}`}
        className="max-w-full h-auto rounded"
      />
    </div>
  );
};

const IframeRendererImpl: React.FC<{
  htmlContent: string;
  partKey: string;
}> = ({ htmlContent, partKey }) => {
  // 1. 用一個寬鬆的 Regex 找到 <iframe> 標籤及其所有屬性
  const iframeTagMatch = htmlContent.match(/<iframe\s+([^>]*)>/);
  if (!iframeTagMatch || !iframeTagMatch[1]) {
    console.error("Could not parse iframe content:", htmlContent);
    return (
      <div className="text-destructive mb-4">
        Error: Could not parse &lt;history&gt; iframe content.
      </div>
    );
  }

  const attrsString = iframeTagMatch[1];
  const attrRegex = /(\S+)=["']([^"']*)["']/g;
  const props: { [key: string]: string } = {};
  let match;

  while ((match = attrRegex.exec(attrsString)) !== null) {
    props[match[1]] = match[2];
  }

  return (
    <iframe
      key={partKey} // 使用 partKey 作為 key
      src={props.src}
      width={props.width}
      height={props.height}
      frameBorder={props.frameborder}
      className="mb-4"
    />
  );
};
const IframeRenderer = React.memo(IframeRendererImpl);

export function RenderDynamicContent({ data, conversationId }: Props) {
  // 1) 圖片 Modal 狀態
  const [img, setImg] = useState<string | null>(null);

  // 2) normalize 函數
  const normalize = (input: unknown) =>
    typeof input === "string"
      ? input.replace(/\\n/g, "\n").replace(/\\r/g, "")
      : JSON.stringify(input, null, 2);

  // 3) Inline 解析: **bold**
  function parseInline(text: string): React.ReactNode[] {
    const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\s*\([^)]+\))/g;
    const parts = text.split(regex);
    return parts.map((seg, i) => {
      if (!seg) return null;

      // A. 檢查是否為粗體
      const mBold = seg.match(/^\*\*(.+)\*\*$/);
      if (mBold) {
        return <strong key={i}>{mBold[1]}</strong>;
      }

      // B. 檢查是否為超連結
      const mLink = seg.match(/^\[([^\]]+)\]\s*\(([^)]+)\)$/);
      if (mLink) {
        const linkText = mLink[1];
        const linkUrl = mLink[2];
        return (
          <a
            key={i}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 my-1 mr-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm hover:bg-blue-500/20 hover:text-blue-300 transition-colors no-underline break-all"
            onClick={(e) => e.stopPropagation()} // 防止觸發父層點擊事件（若有）
          >
            <span className="text-xs opacity-70">🔗</span>
            <span>{linkText}</span>
          </a>
        );
      }

      // C. 普通文字
      return <React.Fragment key={i}>{seg}</React.Fragment>;
    });
  }

  // 4) 自製 Markdown Block
  function MarkdownBlock({ content }: { content: string }) {
    const lines = content.split("\n");
    const elems: React.ReactNode[] = [];

    // 巢狀清單堆疊
    const stack: { type: "ul" | "ol"; items: React.ReactNode[] }[] = [];
    const levels: { level: number; type: "ul" | "ol" }[] = [];

    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLang = "";

    const flushStackToElems = () => {
      while (stack.length > 0) {
        const list = stack.pop()!;
        const Tag = list.type;
        const rendered = (
          <Tag
            key={`list-${stack.length}-${Math.random()}`}
            className="list-outside mb-2 text-foreground"
          >
            {list.items}
          </Tag>
        );
        if (stack.length > 0) {
          stack[stack.length - 1].items.push(rendered);
        } else {
          elems.push(rendered);
        }
      }
      levels.length = 0;
    };

    const flushCodeBlockToElems = () => {
      if (codeLines.length > 0) {
        elems.push(
          <pre
            key={`code-${elems.length}`}
            // 使用與 RenderContentChunk 中 case "code" 相同的樣式
            className="bg-muted text-foreground p-3 rounded overflow-x-auto mb-4 border border-border"
          >
            <code className={codeLang ? `language-${codeLang}` : ""}>
              {codeLines.join("\n")}
            </code>
          </pre>
        );
      }
      codeLines = [];
      codeLang = "";
      inCodeBlock = false;
    };

    lines.forEach((rawLine, idx) => {
      const trimmed = rawLine.trim();
      // === 處理 Code Blocks ===
      const codeMatch = trimmed.match(/^```(\w*)$/); // 匹配 ``` 或 ```lang

      if (codeMatch && !inCodeBlock) {
        // 偵測到 ``` 開頭
        flushStackToElems(); // 先清空所有待辦的列表
        inCodeBlock = true;
        codeLang = codeMatch[1]; // 儲存語言 (例如 "markdown")
        return; // 進入下一行
      }

      if (trimmed === "```" && inCodeBlock) {
        // 偵測到 ``` 結尾
        flushCodeBlockToElems(); // 渲染 code block
        return; // 進入下一行
      }

      if (inCodeBlock) {
        // 正在 code block 內部
        codeLines.push(rawLine);
        return; // 進入下一行
      }

      // === 標題 ===
      const head = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (head) {
        flushStackToElems();
        const level = head[1].length;
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        const size =
          level === 1
            ? "text-2xl"
            : level === 2
            ? "text-xl"
            : level === 3
            ? "text-lg"
            : "text-base";
        elems.push(
          <Tag
            key={`h-${idx}`}
            className={`font-bold mt-4 mb-2 ${size} text-foreground`}
          >
            {head[2]}
          </Tag>
        );
        return;
      }

      // === 巢狀清單（縮排 + 符號） ===
      const indentMatch = rawLine.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
      if (indentMatch) {
        const spaces = indentMatch[1].replace(/\t/g, "  "); // tab = 2 space
        const level = Math.floor(spaces.length / 2); // 每兩空白 = 一層
        const bullet = indentMatch[2];
        const text = indentMatch[3];
        const listType = /^\d+\./.test(bullet) ? "ol" : "ul";
        const isOrdered = listType === "ol";
        const displayText = isOrdered ? `${bullet} ${text}` : text;

        // push 新層
        while (levels.length <= level) {
          stack.push({ type: listType, items: [] });
          levels.push({ level, type: listType });
        }

        // pop 回上層
        while (levels.length > level + 1) {
          const list = stack.pop()!;
          levels.pop();
          const Tag = list.type;
          const rendered = (
            <Tag
              key={`list-${idx}-${Math.random()}`}
              className="list-outside list-disc pl-6 mb-2 text-foreground"
            >
              {list.items}
            </Tag>
          );
          stack[stack.length - 1].items.push(rendered);
        }

        // 加入 <li>
        stack[stack.length - 1].items.push(
          <li key={`li-${idx}-${level}`} className="mb-1">
            {parseInline(displayText)}
          </li>
        );
        return;
      }

      // === 普通段落 ===
      flushStackToElems();
      if (trimmed) {
        elems.push(
          <p key={`p-${idx}`} className="mb-4 text-foreground">
            {parseInline(trimmed)}
          </p>
        );
      }
    });

    flushStackToElems();
    flushCodeBlockToElems();
    return <>{elems}</>;
  }

  // 5) 可折疊區塊組件
  const CollapsibleBlock: React.FC<{
    title: string;
    children: React.ReactNode;
    startOpen?: boolean;
  }> = ({ title, children, startOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startOpen);
    return (
      <div className="mb-4 border border-border rounded-lg bg-card">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left font-medium bg-muted hover:bg-muted/90 rounded-t-lg flex justify-between items-center text-card-foreground"
        >
          <span>{title}</span>
          <span
            className="transform transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
        </button>
        {isOpen && <div className="p-4 border-t border-border">{children}</div>}
      </div>
    );
  };

  // 6) 內容區塊渲染器
  const RenderContentChunk: React.FC<{
    content: string;
    chunkKey: string;
  }> = ({ content, chunkKey }) => {
    const [expanded, setExpanded] = useState<boolean[]>([]);
    const blocks: Detected[] = useMemo(() => {
      const tableSplitRegex = /(?=^\|.*\|\s*$\r?\n^\|?[:\- ]+\|.*$)/m;
      const segments = content.split(tableSplitRegex);
      const newBlocks = segments
        .flatMap((seg) => splitMarkdownBlocks(seg))
        .filter((b) => !(b.type === "markdown" && !b.content.trim()));
      setExpanded(Array(newBlocks.length).fill(false));
      return newBlocks;
    }, [content]);
    const toggle = (i: number) =>
      setExpanded((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    return (
      <>
        {blocks.map((blk, i) => {
          const key = `${chunkKey}-blk-${i}`;
          switch (blk.type) {
            case "table": {
              const { columns, data: rows } = blk.content;
              const show = expanded[i] ? rows : rows.slice(0, 10);
              return (
                <div
                  key={key}
                  className="border border-border rounded p-2 overflow-x-auto mb-4 bg-card"
                >
                  <table className="w-full border-collapse text-foreground">
                    <thead className="bg-muted">
                      <tr>
                        {columns.map((c: string, j: number) => (
                          <th
                            key={j}
                            className="px-2 py-1 text-left text-sm font-medium text-muted-foreground"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {show.map((r: string[], j: number) => (
                        <tr key={j} className="odd:bg-muted/40">
                          {r.map((c: string, k: number) => (
                            <td
                              key={k}
                              className="border border-border px-2 py-1"
                            >
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
                      className="mt-2 px-3 py-1 border border-border rounded text-sm bg-primary text-primary-foreground hover:opacity-90"
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
                  key={key}
                  className="bg-muted text-foreground p-3 rounded overflow-x-auto mb-4 border border-border"
                >
                  <code>{blk.content}</code>
                </pre>
              );
            case "markdown":
              return <MarkdownBlock key={key} content={blk.content} />;
            default:
              return null;
          }
        })}
      </>
    );
  };

  // 7) 標籤解析 Regex
  // 匹配兩種標籤：
  // 1. 閉合標籤 (group 1, 2, 3): <tag>content</tag>
  // 2. 前綴標籤 (group 4, 5): [tag] 或 **[tag]** (可選的 **)
  const tagRegex =
    /(<(brief_summary|detailed_summary|history)>(.*?)<\/\2>)|((?:\*\*)?\[(思考|給使用者的回覆)\](?:\*\*)?)/gs;

  // 8) 最終渲染邏輯
  return (
    <div className="rounded-lg bg-card px-4 pt-4 text-card-foreground">
      {data.map((d, i) => {
        const itemKey = `item-${i}`;

        // --- 處理圖片 ---
        if (d.type === "image") {
          return (
            <ConversationImageBlock
              key={itemKey}
              i={i}
              conversationId={conversationId}
              imageId={d.content}
              setImg={setImg}
            />
          );
        }

        // --- 處理文字訊息 ---
        const raw = normalize(d.content);
        const matches = [...raw.matchAll(tagRegex)];
        const renderedElements: React.ReactNode[] = [];
        let lastIndex = 0;

        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];
          const matchIndex = match.index!;

          // 1. 渲染上一個標籤到這個標籤之間的「無標籤內容」
          const untaggedContent = raw.substring(lastIndex, matchIndex);
          if (untaggedContent) {
            renderedElements.push(
              <RenderContentChunk
                key={`${itemKey}-untagged-${j}`}
                content={untaggedContent}
                chunkKey={`${itemKey}-untagged-${j}`}
              />
            );
          }

          const partKey = `${itemKey}-part-${j}`;
          const isAngleTag = match[1]; // 閉合標籤 <tag>content</tag>
          const isBracketTag = match[4]; // 前綴標籤 [tag] 或 **[tag]**

          if (isAngleTag) {
            // --- 情況 A: 閉合標籤 (brief_summary, detailed_summary) ---
            const tagType = match[2];
            const tagContent = match[3] || "";
            const renderedChunk = (
              <RenderContentChunk content={tagContent} chunkKey={partKey} />
            );

            if (tagType === "brief_summary") {
              renderedElements.push(
                <div key={partKey} className="mb-4">
                  {renderedChunk}
                </div>
              );
            } else if (tagType === "detailed_summary") {
              renderedElements.push(
                <CollapsibleBlock key={partKey} title="詳細內容">
                  {renderedChunk}
                </CollapsibleBlock>
              );
            } else {
              // history
              renderedElements.push(
                <IframeRenderer
                  key={partKey}
                  htmlContent={tagContent}
                  partKey={partKey}
                />
              );
            }
            lastIndex = matchIndex + match[0].length;
          } else if (isBracketTag) {
            // --- 情況 B: 前綴標籤 (思考, 給使用者的回覆) ---
            const tagType = match[5]; // "思考" 或 "給使用者的回覆"

            // 找到這個標籤的內容：從標籤結束後，到下一個標籤開始前 (或字串結尾)
            const contentStartIndex = matchIndex + match[0].length; // match[0] 包含 **
            const nextMatch = matches[j + 1];
            const contentEndIndex = nextMatch ? nextMatch.index : raw.length;

            const tagContent = raw.substring(
              contentStartIndex,
              contentEndIndex
            );

            // 只有當 tagContent 真的有內容時才渲染
            if (tagContent.trim()) {
              const renderedChunk = (
                <RenderContentChunk content={tagContent} chunkKey={partKey} />
              );

              if (tagType === "思考") {
                renderedElements.push(
                  <CollapsibleBlock key={partKey} title="思考過程">
                    {renderedChunk}
                  </CollapsibleBlock>
                );
              } else {
                // 給使用者的回覆
                renderedElements.push(
                  <div key={partKey} className="mb-4">
                    {renderedChunk}
                  </div>
                );
              }
            }
            // 將指針跳到這個標籤內容的結尾
            lastIndex = contentEndIndex;
          }
        }

        // 3. 渲染最後一個標籤到字串結尾的「無標籤內容」
        const remainingContent = raw.substring(lastIndex);
        if (remainingContent) {
          renderedElements.push(
            <RenderContentChunk
              key={`${itemKey}-remaining`}
              content={remainingContent}
              chunkKey={`${itemKey}-remaining`}
            />
          );
        }

        return renderedElements;
      })}

      {img && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setImg(null)}
        >
          <img
            src={img}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
            alt="preview"
          />
        </div>
      )}
    </div>
  );
}
