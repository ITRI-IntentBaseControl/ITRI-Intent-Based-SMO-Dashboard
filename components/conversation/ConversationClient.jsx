"use client";

import React, { useState, useCallback } from "react";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationMessages } from "./ConversationMessages";
import { uploadImage } from "@/app/service/conversation/ExternalService/apiService";

// 從自訂 hook 匯入
import { useConversation } from "../../app/hooks/conversation/useConversation";

export default function ConversationClient({ conversationId }) {
  const {
    isLoading,
    inputValue,
    setInputValue,
    chatMessages,
    setChatMessages,
    typingMessage,
    handleSendMessage,
    isSending,
    retryCountMap,
    setRetryCountMap,
  } = useConversation(conversationId);

  // 圖片上傳狀態：[{ file, imageUid, previewUrl }]
  const [pendingImages, setPendingImages] = useState([]);

  const handleUploadImage = useCallback(async (file) => {
    const previewUrl = URL.createObjectURL(file);
    const result = await uploadImage(conversationId, file);
    if (result?.status_code === 201 && result?.data?.image_uid) {
      setPendingImages((prev) => [
        ...prev,
        { file, imageUid: result.data.image_uid, previewUrl },
      ]);
      return result.data.image_uid;
    }
    URL.revokeObjectURL(previewUrl);
    throw new Error(result?.message || "Upload failed");
  }, [conversationId]);

  const handleRemoveImage = useCallback((index) => {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // 包裝 onSend：送出時帶上圖片 UIDs，送出後清空圖片
  const handleSendWithImages = useCallback((msg, retry = "0", isRegenerate = false, imageUids = []) => {
    // 如果不是重傳且有暫存圖片，使用暫存圖片的 UIDs
    const uids = !isRegenerate && pendingImages.length > 0
      ? pendingImages.map((img) => img.imageUid)
      : imageUids;
    handleSendMessage(msg, retry, isRegenerate, uids);
    // 清空暫存圖片
    if (!isRegenerate && pendingImages.length > 0) {
      pendingImages.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
      setPendingImages([]);
    }
  }, [handleSendMessage, pendingImages]);

  function handleOptionSelect(label) {
    setInputValue((prev) => (prev ? prev + " " + label : label));
  }

  // 當 reward 更新成功時，更新 chatMessages 中對應訊息的 reward
  function handleRewardChange(messageIndex, newReward) {
    setChatMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, reward: newReward } : msg
      )
    );
  }

  // 重新生成：取最後一則 user 訊息重送，並增加 retry 次數
  React.useEffect(() => {
    const handler = () => {
      if (isSending) {
        return;
      }
      // 找到最後一則 user 訊息的索引
      let lastUserIndex = -1;
      for (let i = chatMessages.length - 1; i >= 0; i--) {
        if (chatMessages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }
      if (lastUserIndex >= 0) {
        const userMsg = chatMessages[lastUserIndex];
        // 將字串 retry 轉為數字進行計算
        const currentRetry = parseInt(userMsg.retry || "0", 10);
        const nextRetry = currentRetry + 1;
        // 轉回字串格式
        const nextRetryStr = String(nextRetry);

        // 更新該 user 訊息的 retry 值（字串格式）
        setChatMessages((prev) =>
          prev.map((msg, idx) =>
            idx === lastUserIndex ? { ...msg, retry: nextRetryStr } : msg
          )
        );

        // 重新發送訊息，帶上新的 retry 次數（字串格式，但不添加新的 user 訊息）
        // 從 text_content 取出圖片 UID，確保重傳時帶上原始圖片
        const imageUids = (userMsg.text_content || [])
          .filter((t) => t.type === "image")
          .map((t) => t.content);
        handleSendWithImages(userMsg.content, nextRetryStr, true, imageUids);
      }
    };
    window.addEventListener("conversation:regenerate", handler);
    return () => window.removeEventListener("conversation:regenerate", handler);
  }, [chatMessages, handleSendWithImages, isSending]);

  return (
    <div className="flex flex-col min-w-0 h-screen bg-background">
      <ConversationHeader />

      {/* 訊息 + 狀態欄 同一列 */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* 訊息區 */}
        <div className="flex-1 md:flex-row  overflow-y-auto px-2 py-4">
          <div className="mx-auto max-w-3xl flex fle x-col gap-6">
            <ConversationMessages
              chatMessages={chatMessages}
              typingMessage={typingMessage}
              onSelectOption={handleOptionSelect}
              conversationId={conversationId}
              isSending={isSending}
              onRewardChange={handleRewardChange}
            />
          </div>
        </div>
      </div>

      {/* 輸入框 區塊 (置中對齊同 mx-auto max-w-3xl) */}
      <div className="px-2 pb-4">
        <div className="mx-auto max-w-3xl">
          <ConversationInput
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={handleSendWithImages}
            isLoading={isLoading}
            isSending={isSending}
            conversationId={conversationId}
            onUploadImage={handleUploadImage}
            pendingImages={pendingImages}
            onRemoveImage={handleRemoveImage}
          />
        </div>
      </div>
    </div>
  );
}
