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

  // 2) 再宣告 handleOnMessage，再給 useLoadConversationAndConnect 使用
  const handleOnMessage = useCallback(
    ({ type, data }) => {
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
          setChatMessages((prev) => [...prev, message]);
          break;
        }
        default:
          break;
      }
    },
    // 依賴這些變數時，要仔細檢查是否有可能造成無限迴圈
    [didAutoSend]
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
  };
}
