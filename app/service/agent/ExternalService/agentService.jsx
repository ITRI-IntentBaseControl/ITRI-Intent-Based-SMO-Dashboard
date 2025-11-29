"use client";

import { postAPI } from "@/app/utils/entrypoint";

/** 取得使用者的 agent 列表 */
export async function getAgentList(userUid) {
  try {
    const response = await postAPI(
      "metadata_mgt/AgentManager/get_agent_list_metadata",
      { user_uid: userUid }
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    console.error("[getAgentList] API Error:", error);
    throw error;
  }
}

/** 取得特定 agent 的對話列表 */
export async function getAgentConversationList(userUid, agentUid) {
  try {
    const response = await postAPI(
      "conversation_mgt/ConversationManager/get_agent_conversation_list",
      {
        user_uid: userUid,
        agent_uid: agentUid,
      }
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    console.error("[getAgentConversationList] API Error:", error);
    throw error;
  }
}

/** 為特定 agent 創建新對話 */
export async function createAgentConversation(userUid, agentUid) {
  try {
    const response = await postAPI(
      "conversation_mgt/ConversationManager/create_conversation",
      {
        user_uid: userUid,
        agent_uid: agentUid,
      }
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    console.error("[createAgentConversation] API Error:", error);
    throw error;
  }
}

/** 創建新的 agent */
export async function createAgent(userUid, agentName, apiKey) {
  try {
    const response = await postAPI(
      "metadata_mgt/AgentManager/create_agent_metadata",
      {
        user_uid: userUid,
        agent_name: agentName,
        api_key: apiKey,
      }
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    console.error("[createAgent] API Error:", error);
    throw error;
  }
}

/** 更新 agent 資訊 */
export async function updateAgent(agentUid, agentName, apiKey) {
  try {
    const payload = { agent_uid: agentUid };
    if (agentName !== undefined) payload.agent_name = agentName;
    if (apiKey !== undefined) payload.api_key = apiKey;

    const response = await postAPI(
      "metadata_mgt/AgentManager/update_agent_metadata",
      payload
    );
    return response.data; // { status_code, message }
  } catch (error) {
    console.error("[updateAgent] API Error:", error);
    throw error;
  }
}

/** 刪除 agent */
export async function deleteAgent(agentUid) {
  try {
    const response = await postAPI(
      "metadata_mgt/AgentManager/delete_agent_metadata",
      { agent_uid: agentUid }
    );
    return response.data; // { status_code, message }
  } catch (error) {
    console.error("[deleteAgent] API Error:", error);
    throw error;
  }
}
