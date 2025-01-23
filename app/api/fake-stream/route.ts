// app/api/fake-stream/route.ts
import { NextRequest } from "next/server";

type Delta = {
  type:
    | "text-delta"
    | "code-delta"
    | "image-delta"
    | "title"
    | "id"
    | "suggestion"
    | "clear"
    | "finish"
    | "user-message-id"
    | "kind";
  content: string;
};

export async function POST(req: NextRequest) {
  const textEncoder = new TextEncoder();

  // 建立串流
  const readableStream = new ReadableStream({
    start(controller) {
      // 模擬幾段分段回應
      const deltas: Delta[] = [
        { type: "title", content: "這是一個串流回應示例" },
        { type: "text-delta", content: "哈囉，這是第一段文字..." },
        { type: "text-delta", content: "這是第二段文字..." },
        { type: "code-delta", content: 'console.log("Hello streaming!");' },
        { type: "image-delta", content: "https://placekitten.com/200/300" },
        { type: "finish", content: "" },
      ];

      let i = 0;
      const timer = setInterval(() => {
        if (i >= deltas.length) {
          clearInterval(timer);
          controller.close();
          return;
        }
        const delta = deltas[i++];
        // SSE 格式: data: {...}\n\n
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(delta)}\n\n`)
        );
      }, 1200);
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
