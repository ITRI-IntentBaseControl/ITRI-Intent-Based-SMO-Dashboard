"use client";

import React, { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ConversationClient from "../../ConversationClient";

export default function ConversationPage() {
  // 透過 useParams() 取得動態路由 [uid] 的值
  const { conversation_uid } = useParams() as { conversation_uid: string };

  // 透過 useSearchParams() 取得網址列上的查詢字串，例如 ?msg=Hello
  const searchParams = useSearchParams();
  const initialMsg = searchParams.get("msg") || "";

  // 如果想在Client端撈歷史訊息：
  // const [history, setHistory] = useState<string[]>([]);
  // useEffect(() => {
  //   fetch(`/api/messages?conversationId=${uid}`)
  //     .then(res => res.json())
  //     .then(data => setHistory(data.history || []));
  // }, [uid]);

  // 這裡僅示範直接組裝初始訊息陣列
  const history = useMemo<string[]>(() => {
    const base: string[] = [];
    if (initialMsg) {
      base.push(`[User initial msg] ${initialMsg}`);
    }
    return base;
  }, [initialMsg]);

  return (
    <ConversationClient
      conversationId={conversation_uid}
      initialMessages={history}
      brokerUrl="ws://140.118.2.52:42804"
    />
  );
}
