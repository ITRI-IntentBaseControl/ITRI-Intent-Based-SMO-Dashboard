/* =========================================================
 * utils/markdownParser.ts
 * ---------------------------------------------------------
 *  將「一大段 Markdown 字串」切成可渲染的區塊：
 *    markdown / table / image / code
 *
 *  ⚙️  2025‑06‑04 更新內容
 *  1. tableRE 改成容忍 \r\n 與行首縮排，並放寬對齊線判斷邏輯
 *  2. parseTable 會先統一換行符、移除行首空白，再處理資料
 *  3. 提供 splitMarkdownBlocks 的完整參考實作，方便直接匯入
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
      .map((s) => s.trim());

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

  const pushMarkdown = (txt: string) => {
    /* -1) 只拿掉字面上的 \\n，保留真正 \n ---------------- */
    txt = txt.replace(/\\n/g, ""); // ⚠️ 不再刪 /\r?\n/

    /* 0) 前置修補：黏回被斷行的 list，刪空 li -------------- */
    txt = txt.replace(/-\s*(\r?\n)+\s+/g, "- ");
    txt = txt.replace(/^\s*[-*+]\s*(?=\r?\n)/gm, "");

    /* 1) 去掉首尾純空白行 ---------------------------------- */
    let cleaned = txt.replace(/^\s*(\r?\n)+/, "").replace(/(\r?\n)+\s*$/, "");

    /* 2) 刪掉只有空白的行 ---------------------------------- */
    cleaned = cleaned.replace(/^[ \t]+\r?\n/gm, "");

    /* 3) 折疊過多空行（>=3 → 2）--------------------------- */
    cleaned = cleaned.replace(/(\r?\n){3,}/g, "");

    // 4) 折疊「列表符號前」的空白行（剛好解決 bullet 之間的空行）
    cleaned = cleaned.replace(/(\r?\n){2}(?=\s*[-*+]\s)/g, "\n"); // ★新增這行

    if (cleaned) blocks.push({ type: "markdown", content: cleaned });
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

    // rest = rest.slice(index + match.length);
    rest = rest.slice(index + match.length).replace(/^\s*(\r?\n)+/, "");
  }
  return blocks;
}
