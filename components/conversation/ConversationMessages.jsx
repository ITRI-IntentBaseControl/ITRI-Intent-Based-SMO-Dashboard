// ConversationMessages.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { useLocale } from "@/components/LocaleProvider";

export function ConversationMessages({
  chatMessages,
  onSelectOption,
  conversationId,
  isSending,
  onRewardChange,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const { t } = useLocale();

  // 追蹤每組 user+llm 訊息目前顯示的版本索引
  // key: userMessageIndex, value: selectedVersionIndex
  const [selectedVersions, setSelectedVersions] = React.useState({});

  // 只要 chatMessages 陣列長度改變，就滾到底
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, isSending]);

  // 將訊息分組：每個 user 訊息後跟著所有對應的 llm 回覆（按 retry 排序）
  // 分組規則：
  // - 使用 user 的 retry 值來判斷分組
  // - 重新生成：相同內容 + retry 遞增（0→1→2）→ 合併成一組
  // - 重複送出：相同內容 + retry 都是 0 → 視為獨立訊息
  const groupedMessages = React.useMemo(() => {
    const groups = [];
    let i = 0;

    while (i < chatMessages.length) {
      const msg = chatMessages[i];

      if (msg.role === "user") {
        const userContent = msg.content;
        const userRetry = parseInt(msg.retry || "0", 10);
        const userIndex = i;
        const llmResponses = [];

        // 追蹤當前組的最大 retry 值
        let currentMaxRetry = userRetry;

        // 收集這個 user 訊息之後的所有 llm 回覆
        // 直到遇到下一個不屬於這組的訊息
        let j = i + 1;
        while (j < chatMessages.length) {
          const nextMsg = chatMessages[j];

          if (nextMsg.role === "llm") {
            // 收集 llm 回覆
            llmResponses.push({ ...nextMsg, originalIndex: j });
            j++;
          } else if (nextMsg.role === "user") {
            const nextRetry = parseInt(nextMsg.retry || "0", 10);

            // 判斷是否屬於同一組（重新生成）：
            // 1. 內容相同
            // 2. retry 值是遞增的（表示是重新生成產生的）
            if (
              nextMsg.content === userContent &&
              nextRetry > currentMaxRetry
            ) {
              // 這是重新生成，更新 maxRetry，跳過這個 user 訊息，繼續收集 llm 回覆
              currentMaxRetry = nextRetry;
              j++;
            } else {
              // 這是新的獨立訊息（包括相同內容但 retry=0 的重複送出）
              break;
            }
          } else {
            j++;
          }
        }

        // 按 retry 排序 llm 回覆（將字串轉數字比較）
        llmResponses.sort((a, b) => {
          const retryA = parseInt(a.retry || "0", 10);
          const retryB = parseInt(b.retry || "0", 10);
          return retryA - retryB;
        });

        groups.push({
          userMessage: msg,
          userIndex: userIndex,
          llmResponses: llmResponses,
        });

        // 移動到下一組
        i = j;
      } else {
        // 跳過不屬於任何組的訊息（理論上不應該發生）
        i++;
      }
    }
    return groups;
  }, [chatMessages]);

  // 追蹤每組 llm 回覆的數量，用於判斷是否有新版本加入
  const prevLlmCountsRef = useRef({});

  // 當訊息分組改變時，確保每組都選擇最新的版本（只在有新版本加入時）
  useEffect(() => {
    const newSelectedVersions = {};
    const currentLlmCounts = {};

    groupedMessages.forEach((group) => {
      const { userIndex, llmResponses } = group;
      currentLlmCounts[userIndex] = llmResponses.length;

      if (llmResponses.length > 0) {
        const currentSelection = selectedVersions[userIndex];
        const prevCount = prevLlmCountsRef.current[userIndex] || 0;

        // 只在以下情況切換到最新版本：
        // 1. 該組還沒有選擇版本（首次載入）
        // 2. llm 回覆數量增加了（有新版本加入）
        if (currentSelection === undefined) {
          // 首次載入，選擇最後一個版本
          newSelectedVersions[userIndex] = llmResponses.length - 1;
        } else if (llmResponses.length > prevCount && prevCount > 0) {
          // 有新版本加入，切換到最新版本
          newSelectedVersions[userIndex] = llmResponses.length - 1;
        }
      }
    });

    // 更新 prevLlmCountsRef
    prevLlmCountsRef.current = currentLlmCounts;

    if (Object.keys(newSelectedVersions).length > 0) {
      setSelectedVersions((prev) => ({
        ...prev,
        ...newSelectedVersions,
      }));
    }
  }, [groupedMessages, selectedVersions]);

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto px-2 py-4"
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* 按組渲染訊息 */}
        {groupedMessages.map((group, groupIdx) => {
          const { userMessage, userIndex, llmResponses } = group;
          const isLastGroup = groupIdx === groupedMessages.length - 1;

          // 取得當前顯示的版本索引
          const selectedVersionIdx = selectedVersions[userIndex] || 0;
          const currentLlm = llmResponses[selectedVersionIdx];
          const hasMultipleVersions = llmResponses.length > 1;

          return (
            <React.Fragment key={`group-${userIndex}`}>
              {/* User 訊息 */}
              <div className="flex flex-col gap-2">
                <MessageBubble
                  msg={userMessage}
                  onSelectOption={onSelectOption}
                  conversationId={conversationId}
                />
              </div>

              {/* LLM 回覆 - 只顯示當前選中的版本 */}
              {currentLlm && (
                <div className="flex flex-col gap-2">
                  <MessageBubble
                    msg={currentLlm}
                    onSelectOption={onSelectOption}
                    conversationId={conversationId}
                  />

                  {/* 按鈕顯示在泡泡外、下方（thinking 狀態不顯示按鈕） */}
                  {!currentLlm.isThinking && (
                    <div className="px-12 -mt-2 flex items-center gap-3">
                      {/* 讚/爛按鈕 - 綁定到當前版本的 text_uid（有 text_uid 才顯示） */}
                      {currentLlm.text_uid && (
                        <RewardButtons
                          conversationId={conversationId}
                          textUid={currentLlm.text_uid}
                          currentReward={currentLlm.reward}
                          onRewardChange={(newReward) => {
                            // 更新 chatMessages 中對應訊息的 reward
                            if (
                              onRewardChange &&
                              currentLlm.originalIndex !== undefined
                            ) {
                              onRewardChange(
                                currentLlm.originalIndex,
                                newReward
                              );
                            }
                          }}
                        />
                      )}

                      {/* 版本切換器 - 只在有多個版本時顯示 */}
                      {hasMultipleVersions && (
                        <VersionSwitcher
                          currentVersion={selectedVersionIdx + 1}
                          totalVersions={llmResponses.length}
                          onVersionChange={(newIdx) => {
                            setSelectedVersions((prev) => ({
                              ...prev,
                              [userIndex]: newIdx,
                            }));
                          }}
                        />
                      )}

                      {/* 重新生成按鈕 - 只在最後一組顯示 */}
                      {isLastGroup && <RegenerateButton />}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* 滾動目標節點 */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function RewardButtons({
  conversationId,
  textUid,
  currentReward,
  onRewardChange,
}) {
  const { t } = useLocale();
  const [pending, setPending] = React.useState(false);
  // 直接使用 currentReward，不需要內部狀態，因為父組件會管理
  const reward = currentReward;

  const handleReward = async (value) => {
    if (!textUid) {
      console.error("[RewardButtons] textUid 為空，無法送出 reward");
      return;
    }

    if (pending) {
      console.log("[RewardButtons] 正在處理中，忽略此次點擊");
      return;
    }

    setPending(true);
    try {
      const { rewardText } = await import(
        "@/app/service/conversation/ExternalService/apiService"
      );
      const res = await rewardText(conversationId, textUid, value);

      if (res?.status_code === 200) {
        // 通知父組件更新 chatMessages 中的 reward
        if (onRewardChange) {
          onRewardChange(value);
        }
      } else {
        console.error("[RewardButtons] Reward 更新失敗:", res);
      }
    } catch (e) {
      console.error("[RewardButtons] Reward API 錯誤:", e);
    } finally {
      setPending(false);
    }
  };

  const baseBtn =
    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 transition-colors disabled:opacity-50";

  return (
    <div className="flex items-center gap-1">
      <button
        className={`${baseBtn} ${
          reward === "good"
            ? "bg-sky-100 text-sky-700 ring-sky-300"
            : "bg-muted text-muted-foreground ring-border"
        } hover:bg-sky-50 hover:text-sky-700`}
        onClick={() => handleReward("good")}
        disabled={pending}
        title={t("conversation.reward_good_title")}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        className={`${baseBtn} ${
          reward === "bad"
            ? "bg-rose-100 text-rose-700 ring-rose-300"
            : "bg-muted text-muted-foreground ring-border"
        } hover:bg-rose-50 hover:text-rose-700`}
        onClick={() => handleReward("bad")}
        disabled={pending}
        title={t("conversation.reward_bad_title")}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RegenerateButton() {
  const { t } = useLocale();
  const handleRegenerate = () => {
    window.dispatchEvent(new CustomEvent("conversation:regenerate"));
  };
  return (
    <button
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 bg-background text-foreground ring-border hover:bg-accent"
      onClick={handleRegenerate}
      title={t("conversation.regenerate")}
    >
      <RefreshCw className="h-3.5 w-3.5" />
    </button>
  );
}

// 版本切換器組件
function VersionSwitcher({ currentVersion, totalVersions, onVersionChange }) {
  const { t } = useLocale();
  const handlePrev = () => {
    if (currentVersion > 1) {
      onVersionChange(currentVersion - 2);
    }
  };

  const handleNext = () => {
    if (currentVersion < totalVersions) {
      onVersionChange(currentVersion);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 bg-muted text-muted-foreground ring-border">
      <button
        onClick={handlePrev}
        disabled={currentVersion === 1}
        className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        title={t("conversation.prev_version")}
      >
        ←
      </button>
      <span className="px-2 select-none">
        {currentVersion} / {totalVersions}
      </span>
      <button
        onClick={handleNext}
        disabled={currentVersion === totalVersions}
        className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        title={t("conversation.next_version")}
      >
        →
      </button>
    </div>
  );
}
