"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import ConversationClient from "../../ConversationClient";

export default function ConversationPage() {
  // 透過 useParams() 取得動態路由 [conversation_uid] 的值
  const { conversation_uid } = useParams() as { conversation_uid: string };
  // 透過 useSearchParams() 取得網址列上的查詢字串 (例如 ?msg=Hello)
  const searchParams = useSearchParams();
  const initialMsg = searchParams.get("msg") || "";

  return (
    <ConversationClient
      conversationId={conversation_uid}
      initialMessages={initialMsg ? [initialMsg] : []}
    />
  );
}
