"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAgentList } from "../../service/agent/ExternalService/agentService";

export function useAgentManager() {
  const router = useRouter();
  const [agentList, setAgentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 獲取 agent 列表
  const fetchAgents = useCallback(async () => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      router.push("/signin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAgentList(userUid);

      if (data?.status_code === 200 && data.data) {
        setAgentList(data.data);
      } else {
        setError(data?.message || "Failed to fetch agents");
      }
    } catch (err) {
      console.error("[useAgentManager] Error:", err);
      setError("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agentList,
    loading,
    error,
    refetchAgents: fetchAgents,
  };
}
