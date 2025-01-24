// app/conversation/page.tsx
// 這是一個Server Component，用來初始渲染(SSR)
// 假設我們要 SSR 出「歷史訊息」
import React from "react";
import ConversationClient from "./ConversationClient";

export default async function ConversationPage() {
  // (1) 伺服器端取得預設對話ID / 歷史訊息
  //     這裡只是示範，你可能根據URL或其他邏輯判斷
  const conversationId = null;

  // 假設從 DB 撈歷史訊息
  // const history = await db.messages.findMany({where:{conversationId}});
  // 這裡先用簡單示範
  const history = ["(歷史訊息) Hi!", "(歷史訊息) Hello there!"];

  // (2) 透過 props 傳給 Client Component
  return (
    <ConversationClient
      conversationId={conversationId}
      initialMessages={history}
      brokerUrl="ws://140.118.2.52:42804"
    />
  );
}
