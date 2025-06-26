// 檔案路徑: /InternalService/messageDecorator.js
"use client";

// 定義從後端的 event_type -> 前端角色
const ROLE_MAPPING = {
  user_message: "user",
  llm_message: "llm",
};

/**
 * 將 WebSocket 收到的 rawData(JSON字串) 解析、轉成前端能用的 { role, content }
 * @param {string} rawData
 * @returns {{role: string, content: string} | null}
 */
export function inboundMessageDecorator(rawData) {
  try {
    const data = JSON.parse(rawData);
    const { text_content, role } = data;
    return { role, text_content: text_content };
  } catch (err) {
    console.error("[inboundMessageDecorator] parse error:", err, rawData);
    return null;
  }
}

/**
 * 組裝要送出的 WebSocket payload
 * @param {string} content - 使用者輸入的文字
 * @returns {object}
 */
export function outboundMessageDecorator(content, conversation_uid) {
  return {
    conversation_uid: conversation_uid,
    text_content: [{ type: "message", content }],
  };
}
