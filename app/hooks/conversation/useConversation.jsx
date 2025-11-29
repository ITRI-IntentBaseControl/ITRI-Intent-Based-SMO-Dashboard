// useConversation.js (主 Hook)
import { useCallback, useState } from "react";
import {
  inboundMessageDecorator,
  outboundMessageDecorator,
} from "../../service/conversation/InternalService/messageDecorator";
import { useLoadConversationAndConnect } from "./useLoadConversationAndConnect";

export function useConversation(conversationId) {
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [didAutoSend, setDidAutoSend] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasStreamStarted, setHasStreamStarted] = useState(false);
  // 追蹤每個使用者訊息的 retry 次數: { messageIndex: retryCount }
  const [retryCountMap, setRetryCountMap] = useState({});

  // 2) 再宣告 handleOnMessage，再給 useLoadConversationAndConnect 使用
  const handleOnMessage = useCallback(({ type, data }) => {
    switch (type) {
      case "history": {
        const mapped = data.map((item) => {
          // 判定歷史訊息是否為錯誤：
          // 1. 檢查是否有 isError 欄位
          // 2. 檢查 event_type 是否為 0
          // 3. 檢查內容是否包含特定錯誤字串
          const contentStr =
            item.text_content?.map((t) => t.content).join("\n") || "";
          const isErrorHistory =
            item.isError === true ||
            String(item.event_type) === "0" ||
            contentStr.includes("Agent 處理請求失敗");

          return {
            role: item.role,
            text_content: item.text_content,
            content: contentStr,
            isError: isErrorHistory,
            text_uid: item.text_uid,
            reward: item.reward,
            retry: item.retry || "0",
          };
        });
        setChatMessages(mapped);
        setIsSending(false);
        break;
      }
      case "ws-open":
        handleAutoSend();
        break;
      case "ws-message": {
        const message = inboundMessageDecorator(data);
        if (!message) return;
        const eventType =
          message.event_type !== undefined && message.event_type !== null
            ? String(message.event_type)
            : "";

        if (eventType === "0" || eventType.includes("0")) {
          // console.log("收到後端錯誤:", message.text_content);

          // 1. 建立錯誤訊息物件，加上 isError: true 標記
          const errorMessage = {
            ...message,
            role: "llm", // 確保角色是 llm
            isError: true, // 供前端渲染紅色樣式使用
            retry: message.retry || "0",
            text_uid: message.text_uid,
            reward: message.reward,
          };

          // 2. 取代 thinking 物件（如果有的話）
          setChatMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].isThinking) {
              // 取代 thinking 物件
              return [...prev.slice(0, lastIdx), errorMessage];
            }
            // 否則直接加入
            return [...prev, errorMessage];
          });
          setHasStreamStarted(true);
          setIsSending(false);
        } else if (eventType.includes("2")) {
          // 串流訊息，取代 thinking 物件
          // console.log("收到訊息更新:", message.text_content);
          setHasStreamStarted(true);
          setIsSending(true);
          const newMessage = {
            ...message,
            retry: message.retry || "0",
            text_uid: message.text_uid,
            reward: message.reward,
          };
          setChatMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].isThinking) {
              // 取代 thinking 物件
              return [...prev.slice(0, lastIdx), newMessage];
            }
            // 否則直接加入
            return [...prev, newMessage];
          });
        } else if (eventType.includes("3")) {
          // 串流訊息結束
          // console.log("結束訊息:", message.text_content);
          if (!hasStreamStarted) {
            // 沒有收到 event_type === 2，直接收到 3，表示後端沒有接收到錯誤，但dify出錯
            const errorMessage = {
              role: "llm",
              content: "Agent 發生系統性故障。",
              isError: true,
              text_content: [
                {
                  type: "message",
                  content: "Agent 發生系統性故障。",
                },
              ],
              retry: message.retry || "0",
              text_uid: message.text_uid,
              reward: message.reward,
            };
            setChatMessages((prev) => [...prev, errorMessage]);
          }
          setHasStreamStarted(false);
          setIsSending(false);
        } else {
          // 如果都不包含，執行預設行為（例如處理非串流訊息或未知類型）
          console.warn("收到未知類型或不含2/3的 ws-message:", message);
          setChatMessages((prev) => [...prev, message]);
          setIsSending(false);
        }
        break;
      }
      default:
        break;
    }
  }, [hasStreamStarted]);

  // 3) 最後呼叫 useLoadConversationAndConnect
  const { isLoading, isWsConnected, wsServiceRef } =
    useLoadConversationAndConnect(conversationId, handleOnMessage);

  function handleAutoSend() {
    if (didAutoSend) return;

    const key = `init_msg_${conversationId}`;
    const initMsg = localStorage.getItem(key);
    if (initMsg) {
      setIsSending(true);
      setHasStreamStarted(false);
      setChatMessages((prev) => [...prev, { role: "user", content: initMsg }]);
      sendMessage(initMsg);
      localStorage.removeItem(key);
    }
    setDidAutoSend(true);
  }

  function handleSendMessage(msg, retry = "0", isRegenerate = false) {
    if (isSending) return;
    setIsSending(true);
    setHasStreamStarted(false);
    //目前先暫訂send的全都是string，之後有圖片再改
    if (msg && typeof msg !== "string") {
      msg = inputValue;
    }
    const content = String(msg ?? "").trim();
    if (!content) return;
    setInputValue("");

    // 如果不是重新生成，才添加新的 user 訊息
    if (!isRegenerate) {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content, retry: String(retry) },
      ]);
    }

    // 新增 thinking LLM 物件，等待真正的回覆來取代
    setChatMessages((prev) => [
      ...prev,
      {
        role: "llm",
        content: "Thinking…",
        text_content: [],
        isThinking: true,
        retry: String(retry),
      },
    ]);

    sendMessage(content, String(retry));
  }

  function sendMessage(content, retry = "0") {
    if (!wsServiceRef.current) return;

    //顯示Thinking...效果，不加入訊息隊列

    const payload = outboundMessageDecorator(
      content,
      conversationId,
      String(retry)
    );
    wsServiceRef.current.send(payload);
  }

  return {
    isLoading,
    isWsConnected,
    inputValue,
    setInputValue,
    chatMessages,
    setChatMessages,
    handleSendMessage,
    isSending,
    retryCountMap,
    setRetryCountMap,
  };
}
