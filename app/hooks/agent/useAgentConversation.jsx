"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAgentConversationList,
  createAgentConversation,
} from "../../service/agent/ExternalService/agentService";
import { useLocale } from "@/components/LocaleProvider";

export function useAgentConversation(agentUid) {
  const router = useRouter();
  const { t } = useLocale();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // 獲取特定 agent 的對話列表
  // silent: 靜默更新，不顯示 loading 狀態（用於背景刷新）
  const fetchConversations = useCallback(
    async (silent = false) => {
      const userUid = localStorage.getItem("user_uid");
      if (!userUid) {
        router.push("/signin");
        return;
      }

      if (!agentUid) return;

      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getAgentConversationList(userUid, agentUid);
        if (data?.status_code === 200 && data.data) {
          setConversations(data.data);
        } else {
          setError(
            data?.message ||
              t("conversation.create_failed") ||
              "Failed to fetch conversations"
          );
        }
      } catch (err) {
        console.error("[useAgentConversation] Error:", err);
        setError(
          t("conversation.create_failed") || "Failed to fetch conversations"
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [agentUid, router]
  );

  // 創建新對話
  const createConversation = useCallback(async () => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      router.push("/signin");
      return null;
    }

    if (!agentUid) return null;

    setCreating(true);
    setError(null);

    try {
      const data = await createAgentConversation(userUid, agentUid);
      if (data?.status_code === 200 && data.data?.conversation_uid) {
        // 重新獲取對話列表
        await fetchConversations();
        return data.data.conversation_uid;
      } else {
        setError(
          data?.message ||
            t("conversation.create_failed") ||
            "Failed to create conversation"
        );
        return null;
      }
    } catch (err) {
      console.error("[useAgentConversation] Error:", err);
      setError(
        t("conversation.create_failed") || "Failed to create conversation"
      );
      return null;
    } finally {
      setCreating(false);
    }
  }, [agentUid, router, fetchConversations]);

  return {
    conversations,
    loading,
    creating,
    error,
    fetchConversations,
    createConversation,
  };
}
