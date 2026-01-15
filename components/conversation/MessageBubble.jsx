"use client";
import React from "react";
import { SparklesIcon } from "@/components/icons";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { RenderDynamicContent } from "./RenderDynamicContent";
import { useLocale } from "@/components/LocaleProvider";

/**
 * 顏色改為使用 shadcn/tailwind 的語義化 token，
 * 例如：bg-primary / text-primary-foreground / bg-muted / text-foreground / border-border。
 * 這些會跟隨 next-themes 的黑/白主題自動切換，不再硬寫 bg-gray-300 / bg-zinc-900。
 */
export function MessageBubble({ msg, onSelectOption, conversationId }) {
  const { role, text_content, isError, isThinking } = msg;
  const { t } = useLocale();
  const isUser = role === "user";
  const isAssistant = role === "llm";

  // 計時器：僅在 thinking 狀態下啟動
  const [thinkingSeconds, setThinkingSeconds] = React.useState(0);
  React.useEffect(() => {
    if (isAssistant && isThinking) {
      setThinkingSeconds(0);
      const timer = setInterval(() => {
        setThinkingSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setThinkingSeconds(0);
    }
  }, [isAssistant, isThinking]);

  // 共用 class：泡泡樣式
  const bubbleBase =
    "flex flex-col gap-2 whitespace-pre-wrap break-words px-3 py-2 rounded-xl ring-1";

  // 樣式邏輯：User vs Assistant (正常) vs Assistant (錯誤)
  let bubbleStyle = "";

  if (isUser) {
    bubbleStyle =
      "max-w-[60%] bg-primary text-primary-foreground ring-primary/30";
  } else if (isError) {
    // 錯誤訊息的樣式 (紅色系)
    bubbleStyle =
      "max-w-[80%] bg-red-50 text-red-600 ring-red-200 border border-red-200";
    // 若使用 shadcn 變數可改為: "max-w-[80%] bg-destructive/10 text-destructive ring-destructive/30"
  } else {
    // 正常 Assistant 樣式
    bubbleStyle = "max-w-[80%] bg-background text-foreground ring-border";
  }

  // 「思考中」的佔位，帶計時效果
  const thinking = (
    <p className="rounded-lg px-3 py-2 italic text-center text-muted-foreground flex items-center gap-2">
      {t("render.thinking")}
      <span>... {thinkingSeconds}s</span>
    </p>
  );

  return (
    <div data-role={role} className="group/message w-full px-4 py-2">
      <div className={`flex gap-4 w-full ${isUser ? "justify-end" : ""}`}>
        {/* 助理頭像（會隨主題變化的背景/邊框） */}
        {isAssistant && (
          <div
            className={`size-8 flex items-center justify-center rounded-full ring-1 shrink-0 ${
              isError
                ? "ring-red-200 bg-red-50 text-red-600" // 頭像也變紅
                : "ring-border bg-background"
            }`}
          >
            {/* 如果是錯誤，顯示驚嘆號圖標；否則顯示 Sparkles */}
            {isError ? <AlertCircle size={16} /> : <SparklesIcon size={14} />}
          </div>
        )}

        {/* 泡泡本體：依使用者/助理套不同語義色 */}
        <div className={`${bubbleBase} ${bubbleStyle}`}>
          {isUser && <p>{msg.content}</p>}

          {isAssistant &&
            (isError || (text_content && text_content.length > 0) ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* 如果是錯誤訊息，直接顯示文字內容，或繼續用 RenderDynamicContent */}
                {isError ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold"></span>
                    {/* 假設錯誤內容在第一個 text_content 中 */}
                    {text_content[0]?.content || t("message.unknown_error")}
                  </div>
                ) : (
                  <RenderDynamicContent
                    data={text_content}
                    onSelectOption={onSelectOption}
                    conversationId={conversationId}
                  />
                )}
              </motion.div>
            ) : (
              thinking
            ))}
        </div>
      </div>
    </div>
  );
}
