// components/MarkdownRenderer.tsx
// ------------------------------------------------------------
// Tailwind + shadcn‑compatible Markdown renderer without `react-markdown`.
// Pipeline:
//   1) markdown‑it (+task‑lists)  → HTML  (GFM-ish: tables, strikethrough, autolink, task‑lists)
//   2) isomorphic‑dompurify      → Sanitize HTML
//   3) html‑react‑parser         → React elements,   map <table>/<code> → shadcn/ui
// ------------------------------------------------------------

import React from "react";
import markdownIt from "markdown-it";
import DOMPurify from "isomorphic-dompurify";
import parse, { domToReact, HTMLReactParserOptions } from "html-react-parser";
import clsx from "clsx";

// shadcn/ui table primitives
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ────────────────────────────────────────────────────────────
// markdown‑it instance (tables / strikethrough / autolink built‑in; plus task‑lists)
// markdown-it instance: tables / strike / autolink built-in; task lists skipped to avoid bundler bug
const md = markdownIt({ html: false, linkify: true, breaks: false });

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // 1) Markdown → HTML string
  const html = md.render(content);

  // 2) XSS‑safe (skip on SSR as window undefined)
  const safeHtml =
    typeof window === "undefined" ? html : DOMPurify.sanitize(html);

  // 3) HTML → React elements; map部分元素到 shadcn 元件 / Tailwind 樣式
  const options: HTMLReactParserOptions = {
    replace: (node) => {
      if (typeof node === "object" && "name" in node) {
        const { name, children, parent } = node;
        // —— Table mapping ——
        if (name === "table")
          return (
            <Table className="my-2 text-sm">
              {domToReact(children!, options)}
            </Table>
          );
        if (name === "thead")
          return <TableHeader>{domToReact(children!, options)}</TableHeader>;
        if (name === "tbody")
          return <TableBody>{domToReact(children!, options)}</TableBody>;
        if (name === "tr")
          return <TableRow>{domToReact(children!, options)}</TableRow>;
        if (name === "th")
          return <TableHead>{domToReact(children!, options)}</TableHead>;
        if (name === "td")
          return <TableCell>{domToReact(children!, options)}</TableCell>;

        // —— Code block / inline code ——
        if (name === "pre")
          return (
            <pre className="rounded-lg bg-muted p-3 font-mono text-sm overflow-x-auto">
              {domToReact(children!, options)}
            </pre>
          );

        if (name === "code" && parent?.name !== "pre")
          return (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
              {domToReact(children!, options)}
            </code>
          );
      }
    },
  };

  return (
    <div
      className={clsx(
        "prose prose-invert leading-relaxed space-y-1 break-words",
        className
      )}
    >
      {parse(safeHtml, options)}
    </div>
  );
}
