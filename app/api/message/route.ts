"use client";

// app/api/message.ts
import { postAPI } from "@/app/api/entrypoint";

/**
 * 傳送訊息
 * @param conversationId 對話ID
 * @param userMessage    使用者訊息
 * @returns 後端回傳的 JSON 資料
 */
export async function sendMessageAPI(
  conversationId: string,
  userMessage: string
) {
  const payload = { conversationId, userMessage };
  const response = await postAPI("send-message", payload);
  return response.data;
}
