"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConversationHeader } from "@/components/conversation/ConversationHeader";
import { ConversationInput } from "@/components/conversation/ConversationInput";
import {
  createConversation,
  uploadImage,
} from "@/app/service/conversation/ExternalService/apiService";
import { toast } from "sonner";
import { useLocale } from "@/components/LocaleProvider";

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [preSelectedAgentUid, setPreSelectedAgentUid] = useState(null);

  // 新對話頁的圖片暫存（尚未有 conversation_uid，只存 File 物件）
  const [pendingFiles, setPendingFiles] = useState([]); // [{ file, previewUrl }]

  // Auto-select agent from localStorage
  useEffect(() => {
    const agentUid = localStorage.getItem("selected_agent_uid");
    if (agentUid) {
      setPreSelectedAgentUid(agentUid);
      localStorage.removeItem("selected_agent_uid");
    }
  }, []);

  // 清理 preview URLs
  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // 新對話頁的「上傳」只是暫存 File，不呼叫後端
  const handleUploadImage = useCallback(async (file) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingFiles((prev) => [...prev, { file, previewUrl }]);
    return null; // 不回傳 imageUid，因為還沒有 conversation
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // 將 pendingFiles 轉成 ConversationInput 期望的格式
  const pendingImages = pendingFiles.map((p) => ({
    file: p.file,
    imageUid: null,
    previewUrl: p.previewUrl,
  }));

  const handleSendMessage = async (message) => {
    if (!selectedAgent) return;

    const userUid = localStorage.getItem("user_uid");
    if (!userUid) {
      toast.error(t("agent.cannot_get_user_id"));
      return;
    }

    setIsCreating(true);
    try {
      // 1. 建立對話
      const data = await createConversation(userUid, selectedAgent.agent_uid);
      const conversationUid = data?.data?.conversation_uid;
      if (!conversationUid) {
        throw new Error("No conversation UID returned");
      }

      // 2. 上傳暫存的圖片
      const imageUids = [];
      for (const { file } of pendingFiles) {
        try {
          const result = await uploadImage(conversationUid, file);
          if (result?.status_code === 201 && result?.data?.image_uid) {
            imageUids.push(result.data.image_uid);
          }
        } catch (err) {
          console.error("Failed to upload image:", err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // 3. 暫存訊息和圖片 UIDs 到 localStorage
      if (message && message.trim()) {
        localStorage.setItem(`init_msg_${conversationUid}`, message);
      }
      if (imageUids.length > 0) {
        localStorage.setItem(
          `init_images_${conversationUid}`,
          JSON.stringify(imageUids)
        );
      }

      // 4. 通知側邊欄刷新並跳轉
      window.dispatchEvent(new Event("updateConversationList"));
      router.push(`/conversation/${conversationUid}`);
      setTimeout(() => {
        window.dispatchEvent(new Event("updateConversationList"));
      }, 1500);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to create conversation");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <ConversationHeader
        title={t("conversation.new_conversation") || "New Conversation"}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <ConversationInput
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isCreating}
            showAgentSelect={true}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            preSelectedAgentUid={preSelectedAgentUid}
            onUploadImage={handleUploadImage}
            pendingImages={pendingImages}
            onRemoveImage={handleRemoveImage}
          />
        </div>
      </div>
    </div>
  );
}
