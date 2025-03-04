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
    const { event_type, text } = data;

    // 1) 轉換 role
    const role = ROLE_MAPPING[event_type] || "llm";

    // 2) 不再拼接字串，而是保留原始的 text_content
    const text_content = text?.text_content ?? [];
    return { role, text_content };
  } catch (err) {
    console.error("[inboundMessageDecorator] parse error:", err, rawData);
    return null;
  }
}

/**
 * 組裝要送出的 WebSocket payload
 * @param {string} content - 使用者輸入的文字
 * @param {string} eventType - 與後端協定，如 "test" 或 "message"
 * @returns {object}
 */
export function outboundMessageDecorator(
  content,
  eventType = "test",
  conversation_uid
) {
  console.log(eventType)
  return {
    event_type: eventType,
    conversation_uid: conversation_uid,
    text: {
      text_content: [{ type: "message", content }],
    },
  };
}
