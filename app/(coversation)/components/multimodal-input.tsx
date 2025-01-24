"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  ChangeEvent,
} from "react";
import { toast } from "sonner"; // 如果沒裝 sonner，可移除
import equal from "fast-deep-equal";
import cx from "classnames";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, StopIcon, ArrowUpIcon } from "./chat/icons";

// 依照原本碼
import type {
  Message,
  Attachment,
  ChatRequestOptions,
  CreateMessage,
} from "ai";

interface MultimodalInputProps {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
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
  handleSubmit: (
    event?: { preventDefault?: () => void },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  className?: string;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 2
      }px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  // handle input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  // 發送訊息
  const submitForm = useCallback(() => {
    if (isLoading) {
      toast.error("Model is still responding, please wait!");
      return;
    }
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });
    setAttachments([]);
    resetHeight();
  }, [isLoading, handleSubmit, attachments, setAttachments]);

  // 文件上傳(可自行刪除)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadQueue(files.map((file) => file.name));

    // 你可在此對接後端檔案上傳
    setUploadQueue([]);
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
      />

      <Textarea
        ref={textareaRef}
        placeholder="Send a message..."
        value={input}
        onChange={handleInputChange}
        className={cx(
          "min-h-[24px] max-h-[60vh] overflow-hidden resize-none rounded-2xl text-base bg-muted pb-10 dark:border-zinc-700",
          className
        )}
        rows={2}
        autoFocus
        onKeyDown={(ev) => {
          if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            submitForm();
          }
        }}
      />

      <div className="absolute bottom-0 left-0 p-2 w-fit flex flex-row">
        <Button
          className="rounded-md p-[7px] h-fit"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          variant="ghost"
        >
          <PaperclipIcon size={14} />
        </Button>
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row">
        {isLoading ? (
          <Button
            className="rounded-full p-1.5 h-fit border"
            onClick={() => {
              stop();
              // 自行處理 messages, e.g. sanitize
            }}
          >
            <StopIcon size={14} />
          </Button>
        ) : (
          <Button
            className="rounded-full p-1.5 h-fit border"
            onClick={(event) => {
              event.preventDefault();
              submitForm();
            }}
            disabled={input.length === 0 || uploadQueue.length > 0}
          >
            <ArrowUpIcon size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(PureMultimodalInput, (prev, next) => {
  if (prev.input !== next.input) return false;
  if (prev.isLoading !== next.isLoading) return false;
  if (!equal(prev.attachments, next.attachments)) return false;
  return true;
});
