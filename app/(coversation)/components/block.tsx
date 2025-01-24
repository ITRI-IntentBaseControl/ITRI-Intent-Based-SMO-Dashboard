"use client";

import { memo } from "react";
import equal from "fast-deep-equal";
import type {
  Attachment,
  Message,
  Vote,
  CreateMessage,
  ChatRequestOptions,
} from "ai";

interface BlockProps {
  chatId: string;
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: React.Dispatch<React.SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: React.Dispatch<React.SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
}

/**
 * 若你不需要 block 這個複雜UI功能，可刪此檔
 */
function PureBlock({
  chatId,
  input,
  setInput,
  handleSubmit, // 來自 Chat Props
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  messages,
  setMessages,
  reload,
  votes,
  isReadonly,
}: BlockProps) {
  // 原檔案是一個超大的彈窗/編輯器/console
  // 這裡簡化為「若 block 未顯示則不 render」
  const blockVisible = false;

  if (!blockVisible) return null;
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-50">
      {/* 這裡放 block 內容 */}
      <div className="bg-white w-full h-full">Block UI ...</div>
    </div>
  );
}

export const Block = memo(PureBlock, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  return true;
});
