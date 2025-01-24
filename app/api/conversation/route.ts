"use client";

// app/api/conversation.ts
import { postAPI } from "@/app/api/entrypoint";

/**
 * 建立對話
 * @returns { conversationId, topic }
 */
export async function createConversation() {
  // 對後端 "create-conversation" 端點發送 POST 請求
  const response = await postAPI("create-conversation", {});
  return response.data;
}
