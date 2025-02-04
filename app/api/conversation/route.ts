// app/api/conversation.ts
"use client"; // 確保在前端可使用 fetch 或其他 API 調用

import { postAPI } from "@/app/api/entrypoint";

/**
 * 建立對話
 * @returns { conversationId, topic }
 */
export async function createConversation(user_uid: string) {
  // 對後端 "create-conversation" 端點發送 POST 請求
  const response = await postAPI(
    "conversation_mgt/ConversationManager/create_conversation",
    { user_uid }
  );
  return response.data;
}
