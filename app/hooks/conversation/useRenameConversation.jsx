"use client";

import { useState, useRef, useEffect } from "react";
import { renameConversation } from "../../service/conversation/ExternalService/apiService";

export function useRenameConversation(conversationList, setConversationList) {
  //追蹤要變更name的conversation是哪一個
  const [editingConversation, setEditingConversation] = useState(null);
  //追蹤name
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

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
  }, [editingConversation]);

  // 監聽點擊事件，點擊 input 以外的地方退出編輯模式
  useEffect(() => {
    function handleClickOutside(event) {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setEditingConversation(null);
      }
    }
    if (editingConversation) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingConversation]);

  // 啟動編輯模式
  const startEditing = (conversation) => {
    setEditingConversation(conversation.conversation_uid);
    setEditValue(conversation.conversation_name);
  };

  // 取消編輯模式
  const cancelEditing = () => {
    setEditingConversation(null);
  };

  // 更新對話名稱
  const handleRename = async () => {
    if (
      !editValue.trim() ||
      conversationList.find(
        (item) => item.conversation_uid === editingConversation
      )?.conversation_name === editValue
    ) {
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
  };

  return {
    editingConversation,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    handleRename,
  };
}
