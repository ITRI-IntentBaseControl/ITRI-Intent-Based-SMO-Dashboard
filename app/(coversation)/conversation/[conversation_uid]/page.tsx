// app/conversation/[conversation_uid]/page.tsx

import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_MODEL_NAME, models } from "@/lib/ai/models";

export default async function Page(props: {
  params: { conversation_uid: string };
}) {
  // 取得路由參數
  const { conversation_uid } = props.params;

  // 可透過 cookie 決定預設模型，不需要的話可以刪掉
  const cookieStore = cookies();
  const modelIdFromCookie = cookieStore.get("model-id")?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      <Chat
        // 把 conversation_uid 當作整個對話的 ID
        id={conversation_uid}
        // 如果不需要任何初始訊息，就給空陣列
        // 這裡示範兩條簡單訊息做測試
        initialMessages={[
          {
            id: "sys-1",
            role: "system",
            content: "你是一個超級厲害的程式助理，會使用 Markdown 排版回應。",
          },
          {
            id: "user-1",
            role: "user",
            content: "嗨，我想測試串流功能，給我點文字吧！",
          },
        ]}
        selectedModelId={selectedModelId}
        // 既然不做隱私權檢查，就直接寫 public
        selectedVisibilityType="public"
        // 不想給別人編輯就改 true，否則給 false
        isReadonly={false}
      />

      {/* DataStreamHandler 會去監聽 useChat(...) 的 SSE 資料 */}
      <DataStreamHandler id={conversation_uid} />
    </>
  );
}
