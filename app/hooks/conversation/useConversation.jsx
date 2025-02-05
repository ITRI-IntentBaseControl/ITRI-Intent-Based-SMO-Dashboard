// useConversation.js (主 Hook)
import { useCallback, useState, useRef } from "react";
import {
  inboundMessageDecorator,
  outboundMessageDecorator,
} from "../../service/conversation/InternalService/messageDecorator";
import { useLoadConversationAndConnect } from "./useLoadConversationAndConnect";
import { useTypingEffect } from "./useTypingQueue";

export function useConversation(conversationId) {
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [didAutoSend, setDidAutoSend] = useState(false);

  // 1) 先宣告 handleOnMessage，再給 useLoadConversationAndConnect 使用
  const handleOnMessage = useCallback(
    ({ type, data }) => {
      switch (type) {
        case "history": {
          const mapped = data.map((item) => ({
            role: item.role,
            content: item.text_content.map((t) => t.content).join("\n"),
          }));
          setChatMessages(mapped);
          break;
        }
        case "ws-open":
          handleAutoSend();
          break;
        case "ws-message": {
          const message = inboundMessageDecorator(data);
          if (!message) return;

          if (message.role === "llm") {
            pushPendingMessage(message);
          } else {
            setChatMessages((prev) => [...prev, message]);
          }
          break;
        }
        default:
          break;
      }
    },
    // 依賴這些變數時，要仔細檢查是否有可能造成無限迴圈
    [
      didAutoSend /* pushPendingMessage 後面才會宣告，所以要處理位置或用 useRef */,
    ]
  );

  // 2) 再呼叫 useTypingEffect
  const { typingMessage, pushPendingMessage } = useTypingEffect(
    [],
    (finishedMsg) => {
      setChatMessages((prev) => [...prev, finishedMsg]);
    }
  );

  // 3) 最後呼叫 useLoadConversationAndConnect
  const { isLoading, isWsConnected, wsServiceRef } =
    useLoadConversationAndConnect(conversationId, handleOnMessage);

  // ---- 其餘程式碼不變 ----

  function handleAutoSend() {
    if (didAutoSend) return;
    const key = `init_msg_${conversationId}`;
    const initMsg = localStorage.getItem(key);
    if (initMsg) {
      setChatMessages((prev) => [...prev, { role: "user", content: initMsg }]);
      sendMessage(initMsg);
      localStorage.removeItem(key);
    }
    setDidAutoSend(true);
  }

  function handleSendMessage(msg) {
    const content = (msg ?? inputValue).trim();
    if (!content) return;
    setInputValue("");
    setChatMessages((prev) => [...prev, { role: "user", content }]);
    sendMessage(content);
  }

  function sendMessage(content) {
    if (!wsServiceRef.current) return;
    const payload = outboundMessageDecorator(content, "test");
    wsServiceRef.current.send(payload);
  }

  return {
    isLoading,
    isWsConnected,
    inputValue,
    setInputValue,
    chatMessages,
    typingMessage,
    handleSendMessage,
  };
}
