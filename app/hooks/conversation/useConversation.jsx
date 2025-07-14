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
  const [isSending, setIsSending] = useState(false);

  // 2) 再宣告 handleOnMessage，再給 useLoadConversationAndConnect 使用
  const handleOnMessage = useCallback(({ type, data }) => {
    switch (type) {
      case "history": {
        // 直接把 text_content 整包塞進去，保留陣列形式
        const mapped = data.map((item) => ({
          role: item.role,
          text_content: item.text_content,
          // 如果想另外保留預覽用的 content，也可以再拼接
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
        const eventType = message.event_type ? String(message.event_type) : "";

        if (eventType.includes("2")) {
          // 串流訊息
          console.log("收到訊息更新:", message.text_content);
          setChatMessages((prev) => [...prev, message]);
        } else if (eventType.includes("3")) {
          // 串流訊息結束
          console.log("結束訊息:", message.text_content);
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
  }, []);

  // 3) 最後呼叫 useLoadConversationAndConnect
  const { isLoading, isWsConnected, wsServiceRef } =
    useLoadConversationAndConnect(conversationId, handleOnMessage);

  // ---- 其餘程式碼不變 ----

  function handleAutoSend() {
    if (didAutoSend) return;
    const key = `init_msg_${conversationId}`;
    const initMsg = localStorage.getItem(key);
    if (initMsg) {
      setIsSending(true);
      setChatMessages((prev) => [...prev, { role: "user", content: initMsg }]);
      sendMessage(initMsg);
      localStorage.removeItem(key);
    }
    setDidAutoSend(true);
  }

  function handleSendMessage(msg) {
    if (isSending) return;
    setIsSending(true);
    //目前先暫訂send的全都是string，之後有圖片再改
    if (msg && typeof msg !== "string") {
      msg = inputValue;
    }
    const content = String(msg ?? "").trim();
    if (!content) return;
    setInputValue("");
    setChatMessages((prev) => [...prev, { role: "user", content }]);
    sendMessage(content);
  }

  function sendMessage(content) {
    if (!wsServiceRef.current) return;

    //顯示Thinking...效果，不加入訊息隊列

    const payload = outboundMessageDecorator(content, conversationId);
    wsServiceRef.current.send(payload);
  }

  return {
    isLoading,
    isWsConnected,
    inputValue,
    setInputValue,
    chatMessages,
    handleSendMessage,
    isSending,
  };
}
