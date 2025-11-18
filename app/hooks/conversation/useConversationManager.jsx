// useConversationManager.js
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getConversationList,
  deleteConversation,
  renameConversation,
} from "../../service/conversation/ExternalService/apiService";

export function useConversationManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [conversationList, setConversationList] = useState([]);

  // --- 重新命名相關的狀態 ---
  const [editingConversation, setEditingConversation] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);
  // ----------------------------------------------------

  // --- 1. 列表獲取邏輯 ---
  const fetchConversations = useCallback(async () => {
    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      router.push("/signin");
      return;
    }
    try {
      const data = await getConversationList(userUid);
      if (data?.status_code && data.data) {
        setConversationList(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [router]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  // ----------------------------------------------------

  // --- 2. 刪除邏輯 ---
  const handleDelete = useCallback(
    async (conversationUid) => {
      try {
        const res = await deleteConversation(conversationUid);
        if (res?.status_code === 200) {
          setConversationList((prev) =>
            prev.filter((c) => c.conversation_uid !== conversationUid)
          );
          // 刪除成功後，處理路由跳轉
          if (pathname === `/conversation/${conversationUid}`) {
            router.push("/");
          }
          // 🚨 這裡不需要再發送 window.dispatchEvent
        } else {
          console.error("刪除對話失敗", res);
        }
      } catch (err) {
        console.error("刪除對話出錯", err);
      }
    },
    [pathname, router]
  );
  // ----------------------------------------------------

  // --- 3. 重新命名邏輯 ---
  const startEditing = useCallback((conversation) => {
    setEditingConversation(conversation.conversation_uid);
    setEditValue(conversation.conversation_name);
    // 延遲聚焦確保 input 已經渲染
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingConversation(null);
  }, []);

  const handleRename = useCallback(async () => {
    // 檢查邏輯
    const currentName = conversationList.find(
      (item) => item.conversation_uid === editingConversation
    )?.conversation_name;

    if (!editValue.trim() || currentName === editValue) {
      cancelEditing();
      return;
    }

    try {
      const data = await renameConversation(editingConversation, editValue);
      if (data?.status_code) {
        setConversationList((prev) =>
          prev.map((item) =>
            item.conversation_uid === editingConversation
              ? { ...item, conversation_name: editValue }
              : item
          )
        );
      } else {
        console.error("Rename conversation failed:", data);
      }
    } catch (error) {
      console.error("Rename conversation API Error:", error);
    }
    cancelEditing();
  }, [conversationList, editingConversation, editValue, cancelEditing]);
  // ----------------------------------------------------

  // --- 4. 編輯模式的 UI 副作用 ---
  // 監聽鍵盤事件 (ESC 鍵)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        cancelEditing();
      }
    }
    if (editingConversation) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingConversation, cancelEditing]);

  // 監聽點擊外部事件
  useEffect(() => {
    function handleClickOutside(event) {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        handleRename(); // 點擊外部時，觸發保存邏輯
      }
    }
    if (editingConversation) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingConversation, handleRename]);

  // 監聽創新對話事件
  useEffect(() => {
    const EVENT_NAME = "updateConversationList";
    const onListChanged = () => {
      fetchConversations();
    };

    window.addEventListener(EVENT_NAME, onListChanged);

    return () => {
      window.removeEventListener(EVENT_NAME, onListChanged);
    };
  }, [fetchConversations]);

  // ----------------------------------------------------

  // 匯出所有需要的狀態和操作
  return {
    conversationList,
    handleDelete,
    editingConversation,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    handleRename,
  };
}
