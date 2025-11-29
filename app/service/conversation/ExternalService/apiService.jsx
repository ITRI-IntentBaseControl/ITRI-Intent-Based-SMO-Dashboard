"use client";

import { postAPI } from "@/app/utils/entrypoint";

/** 取得指定使用者的對話列表 */
export async function getConversationList(userUid) {
  try {
    const response = await postAPI(
      "conversation_mgt/ConversationManager/get_conversation_list",
      { user_uid: userUid }
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    console.error("[getConversationList] API Error:", error);
    throw error;
  }
}

/** 刪除指定對話 */
export async function deleteConversation(conversationUid) {
  try {
    // 假設後端的刪除路由如下，請依實際為準
    const response = await postAPI(
      "conversation_mgt/ConversationManager/delete_conversation",
      { conversation_uid: conversationUid }
    );
    return response.data; // { status_code, message, ... }
  } catch (error) {
    console.error("[deleteConversation] API Error:", error);
    throw error;
  }
}

/** 重新命名指定對話 */
export async function renameConversation(conversationUid, newName) {
  try {
    // 假設後端的更新路由如下，請依實際為準
    const response = await postAPI(
      "metadata_mgt/ConversationManager/update_conversation_name",
      {
        conversation_uid: conversationUid,
        conversation_name: newName,
      }
    );
    return response.data; // { status_code, message, ... }
  } catch (error) {
    console.error("[renameConversation] API Error:", error);
    throw error;
  }
}

export async function getConversationHistory(conversationUid) {
  try {
    // 直接使用 postAPI
    const response = await postAPI(
      "conversation_mgt/TextManager/get_text_list",
      {
        conversation_uid: conversationUid,
      }
    );

    // 檢查回傳
    // Axios 返回結構:
    //   { status: number, data: { status_code: number, message: string, data: [...] } }
    if (response.status !== 200) {
      throw new Error(`getConversationHistory failed: ${response.status}`);
    }

    // 回傳後端 JSON
    return response.data;
    // e.g. { status: true, message: "...", data: [...對話列表...] }
  } catch (error) {
    console.error("[getConversationHistory] API Error:", error);
    throw error;
  }
}

/**
 * 建立對話
 * @param {string} user_uid - 使用者 UID
 * @param {string} agent_uid - Agent UID (可選)
 * @returns { conversationId, topic }
 */
export async function createConversation(user_uid, agent_uid = null) {
  // 對後端 "create-conversation" 端點發送 POST 請求
  const payload = { user_uid };
  if (agent_uid) {
    payload.agent_uid = agent_uid;
  }
  const response = await postAPI(
    "conversation_mgt/ConversationManager/create_conversation",
    payload
  );
  return response.data;
}

/** 取得對話照片 */
export async function getImage(conversationUid, imageUid) {
  try {
    // 發送 POST 請求，並要求 responseType 為 'blob'
    const response = await postAPI(
      "conversation_mgt/ImageManager/get_image",
      {
        conversation_uid: conversationUid,
        image_uid: imageUid,
      },
      { responseType: "blob" }
    );

    // 檢查響應是否為錯誤實例
    if (response instanceof Error) {
      throw response;
    }

    // 檢查響應數據是否為 Blob
    if (response.data instanceof Blob) {
      return response.data;
    } else {
      // 如果不是 Blob，可能是一個 JSON 錯誤訊息
      try {
        // 嘗試將非 Blob 數據讀取為文本，然後解析為 JSON 錯誤訊息
        const errorText = await new Response(response.data).text();
        const errorJson = JSON.parse(errorText);
        console.error(
          "getImage API Error (non-blob response):",
          errorJson.error || "Unknown error"
        );
        return null;
      } catch (parseError) {
        // 如果無法解析為 JSON，則直接報錯
        console.error(
          "getImage API Error: Unexpected response data type.",
          parseError,
          response.data
        );
        return null;
      }
    }
  } catch (error) {
    console.error("[getImage] API Error:", error);
    return null; // 捕獲錯誤並返回 null
  }
}
