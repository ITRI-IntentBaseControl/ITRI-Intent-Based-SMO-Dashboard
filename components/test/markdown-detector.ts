"use client";
/* =========================================================
 * utils/markdownParser.ts
 * ---------------------------------------------------------
 *  將「一大段 Markdown 字串」切成可渲染的區塊：
 *    markdown / table / image / code
 *
 *  ⚙️  2025‑06‑05 更新內容
 *  1. pushMarkdown   ‑ 減少多餘空行、智能合併被硬斷的段落行
 *  2. parseTable     ‑ 保留 **bold** 標記以便表格內可渲染粗體
 *  3. ✨ 空白 / 換行字串不再渲染（cleaned.trim() 檢查）
 * =======================================================*/

/* ---------- Regular Expressions ------------------------ */
// 支援 `|` 行首可縮排 (list / quote 內)，亦可處理 Windows (\r\n) 換行
const tableRE =
  /(?:^|\r?\n)\s*\|[^\n]+\|\s*\r?\n\s*\|(?:\s*[-:]+\s*\|)+\s*\r?\n(?:\s*\|[^\n]+\|\s*\r?\n?)+/g;
const codeBlockRE = /```[\s\S]*?```/g; // ``` fenced code ```
const mdImageRE = /!\[.*?\]\((.*?)\)/g; // Markdown image
const rawBase64RE = /^[A-Za-z0-9+/]{60,}={0,2}$/; // 粗略判斷 base64
const jsonBlockRE = /(?:^|\r?\n)\s*\{[\s\S]*?\}\s*(?=\r?\n|$)/g;

/* ---------- 型別定義 ------------------------------------ */
export type Detected =
  | { type: "markdown"; content: string }
  | { type: "table"; content: { columns: string[]; data: string[][] } }
  | { type: "image"; content: string }
  | { type: "code"; content: string };

/* ---------- Utils：單張表格 → {columns,data} ------------- */
function parseTable(md: string) {
  const lines = md
    .replace(/\r\n/g, "\n") // Windows → LF
    .replace(/^\s+/gm, "") // 去掉行首縮排
    .split("\n")
    .filter((l) => l.trim().startsWith("|"));

  const [header, , ...body] = lines;
  if (!header) return { columns: [], data: [] };

  const toCells = (row: string) =>
    row
      .slice(1, -1) // 把首尾 `|`
      .split("|")
      .map((s) => s.trim()); // 保留 **bold** 等行內標記

  const columns = toCells(header);
  const data = body.map(toCells);

  return { columns, data };
}

/* ---------- 主函式：把整段 Markdown 拆成可渲染區塊 ---------- */
export function splitMarkdownBlocks(input: unknown): Detected[] {
  const blocks: Detected[] = [];
  const raw =
    typeof input === "string" ? input : JSON.stringify(input, null, 2);
  let rest = raw;

  // 將處理後的文字推入 blocks 陣列
  const pushMarkdown = (txt: string) => {
    /* -1) 移除字面上的 \n，保留真正換行 -------------------- */
    txt = txt.replace(/\\n/g, "");

    /* 0) 將被硬切換行的段落合併：
     *    把「上一行結尾非 markdown 控制符，而下一行行首也非控制符」的單一換行改為空格
     */
    txt = txt.replace(/([^\n])\n(?!\n)(?!\s*[#>\-|*+]|\s*\d+\.)/g, "$1 ");

    /* 1) 去掉首尾純空白行 ---------------------------------- */
    let cleaned = txt.replace(/^\s*(\r?\n)+/, "").replace(/(\r?\n)+\s*$/, "");

    /* 2) 刪掉只有空白的行 ---------------------------------- */
    cleaned = cleaned.replace(/^[ \t]+\r?\n/gm, "");

    /* 3) 折疊連續空行（>=2 → 1）--------------------------- */
    cleaned = cleaned.replace(/(\r?\n){2,}/g, "\n");

    // 4) 折疊「列表符號前」的空白行（解決 bullet 之間多空行）
    cleaned = cleaned
      // 標題行後面 >=2 空行 → 1
      .replace(/(\\*\\*.*?\\*\\*:)(\\r?\\n){2,}(?=\\s*\\|)/g, "$1\\n")
      // 表格前連續空行 → 1
      .replace(/(\\r?\\n){2,}(?=\\s*\\|)/g, "\\n");

    /* 5) 若內容為純空白／換行，不要渲染 -------------------- */
    if (!cleaned.trim()) return; // 🚫 內容只有空白或換行

    blocks.push({ type: "markdown", content: cleaned });
  };

  while (rest) {
    // 找出離現在最近的候選
    const tableMatch = rest.match(tableRE);
    const codeMatch = rest.match(codeBlockRE);
    const imgMatch = rest.match(mdImageRE);
    const jsonMatch = rest.match(jsonBlockRE);

    const candidates = [tableMatch, codeMatch, imgMatch, jsonMatch]
      .filter(Boolean)
      .map((m) => ({
        match: (m as RegExpMatchArray)[0],
        index: rest.indexOf((m as RegExpMatchArray)[0]),
      }))
      .sort((a, b) => a.index - b.index);

    if (!candidates.length) {
      pushMarkdown(rest);
      break;
    }

    const { match, index } = candidates[0];
    pushMarkdown(rest.slice(0, index));

    /* ---------- 分類並填入 blocks ------------------- */
    if (tableRE.test(match)) {
      blocks.push({ type: "table", content: parseTable(match) });
    } else if (codeBlockRE.test(match)) {
      blocks.push({ type: "code", content: match.replace(/```/g, "").trim() });
    } else if (mdImageRE.test(match)) {
      const src = mdImageRE.exec(match)![1];
      if (rawBase64RE.test(src)) {
        blocks.push({ type: "image", content: `data:image/png;base64,${src}` });
      } else {
        blocks.push({ type: "image", content: src });
      }
    } else if (jsonBlockRE.test(match)) {
      blocks.push({ type: "code", content: match.trim() });
    }

    // 繼續處理後續字串，並清掉最前面的空白行
    rest = rest.slice(index + match.length).replace(/^\s*(\r?\n)+/, "");
  }
  return blocks;
}
