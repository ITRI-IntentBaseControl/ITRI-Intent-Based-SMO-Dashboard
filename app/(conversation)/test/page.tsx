"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TestClient from "@/components/test/TestClient";

export default function TestPage() {
  const [userUid, setUserUid] = useState(null);
  // 透過 useSearchParams() 取得網址列上的查詢字串 (例如 ?msg=Hello)
  const searchParams = useSearchParams();

  const conversationUid = searchParams.get("conversation_uid") || null;
  const initialMsg = searchParams.get("msg") || "";

  // 在元件載入時從 localStorage 抓取 user_uid
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserUid = localStorage.getItem("user_uid");
      setUserUid(storedUserUid);
    }
  }, []);

  return (
    <TestClient
      //將userUid傳給TestClient
      userUid={userUid}
      conversationUid={conversationUid}
      // 若有帶 ?msg=xxx，則將它包成陣列傳給 initialMessages
      initialMessages={initialMsg ? [initialMsg] : []}
    />
  );
}
