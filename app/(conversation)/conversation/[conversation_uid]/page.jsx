"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import ConversationClient from "../../../../components/conversation/ConversationClient";

export default function ConversationPage() {
  // 透過 useParams() 取得動態路由 [conversation_uid] 的值
  // 移除 TypeScript 的型別斷言 (as { conversation_uid: string })
  const params = useParams();
  const conversation_uid = params.conversation_uid;

  // 透過 useSearchParams() 取得網址列上的查詢字串 (例如 ?msg=Hello)
  const searchParams = useSearchParams();
  const initialMsg = searchParams.get("msg") || "";

  return (
    <ConversationClient
      conversationId={conversation_uid}
      // 若有帶 ?msg=xxx，則將它包成陣列傳給 initialMessages
      initialMessages={initialMsg ? [initialMsg] : []}
    />
  );
}
