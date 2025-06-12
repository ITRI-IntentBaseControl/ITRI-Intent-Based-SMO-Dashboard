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
    const role ="llm";
    
    // ❷ 取出文字區塊，確保一定是陣列
    const textBlocks =
      data?.text?.text_content && Array.isArray(data.text.text_content)
        ? data.text.text_content
        : [{ type: "message", content: String(data.text ?? "") }];
    return { role, text_content: textBlocks };
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
export function outboundMessageDecorator(
  content,
  eventType = "test",
  conversation_uid
) {
  return {
    event_type: eventType,
    conversation_uid: conversation_uid,
    text: {
      text_content: [{ type: "message", content }],
    },
  };
}

