"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Mic, Square, ImagePlus, X } from "lucide-react";
import { useAgentManager } from "@/app/hooks/agent/useAgentManager";
import { transcribeSpeech } from "@/app/service/conversation/ExternalService/apiService";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RECORDING_SECONDS = 30;
const MIN_RECORDING_SECONDS = 1;

export function ConversationInput({
  inputValue,
  onChange,
  onSend,
  isLoading,
  isSending = false,
  showAgentSelect = false,
  selectedAgent = null,
  onSelectAgent = null,
  preSelectedAgentUid = null,
  onUploadImage = null,
  pendingImages = [],
  onRemoveImage = null,
}) {
  const { t } = useLocale();
  const { agentList } = useAgentManager();
  const [internalSelectedAgent, setInternalSelectedAgent] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ---- 錄音狀態 ----
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const speechChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  const currentSelectedAgent =
    selectedAgent !== null ? selectedAgent : internalSelectedAgent;
  const setCurrentSelectedAgent = onSelectAgent || setInternalSelectedAgent;

  // Auto-select agent from preSelectedAgentUid
  useEffect(() => {
    if (preSelectedAgentUid && agentList.length > 0) {
      const agent = agentList.find((a) => a.agent_uid === preSelectedAgentUid);
      if (agent) {
        setCurrentSelectedAgent(agent);
      }
    }
  }, [preSelectedAgentUid, agentList, setCurrentSelectedAgent]);

  // 清理錄音資源
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // ---- MediaRecorder 錄音 ----
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      speechChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          speechChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 停止所有音軌
        stream.getTracks().forEach((track) => track.stop());
        // 清除計時器
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        // 檢查錄音時長
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        if (duration < MIN_RECORDING_SECONDS) {
          toast.error(t("voice.too_short"));
          setIsRecording(false);
          setRecordingSeconds(0);
          return;
        }

        // 上傳辨識
        setIsRecording(false);
        setIsTranscribing(true);
        setRecordingSeconds(0);

        try {
          const speechBlob = new Blob(speechChunksRef.current, { type: "audio/webm" });
          const result = await transcribeSpeech(speechBlob);

          if (result?.status_code === 200 && result?.data?.text) {
            // 追加到現有文字
            const currentText = inputValue || "";
            const separator = currentText && !currentText.endsWith(" ") ? " " : "";
            onChange(currentText + separator + result.data.text);
          } else {
            toast.error(t("voice.transcribe_failed"));
          }
        } catch (err) {
          console.error("[transcribe] error:", err);
          toast.error(t("voice.transcribe_failed"));
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // 計時器
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            // 到達上限，自動停止
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            return MAX_RECORDING_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("[startRecording] error:", err);
      if (err.name === "NotAllowedError") {
        toast.error(t("voice.mic_denied"));
      } else {
        toast.error(t("voice.transcribe_failed"));
      }
    }
  }, [inputValue, onChange, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ---- 圖片上傳 ----
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!onUploadImage) return;

    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToUpload = files.slice(0, remaining);

    for (const file of filesToUpload) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      if (file.type !== "image/png") {
        toast.error(`${file.name} is not PNG format`);
        continue;
      }

      setIsUploading(true);
      try {
        await onUploadImage(file);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // 判斷是否可以送出
  const canSend =
    !isLoading &&
    !isSending &&
    !isRecording &&
    !isTranscribing &&
    (inputValue.trim() !== "" || pendingImages.length > 0) &&
    (!showAgentSelect || currentSelectedAgent);

  const handleSend = () => {
    if (!canSend) return;
    if (showAgentSelect && !currentSelectedAgent) {
      toast.error(
        t("agent.select_required_full") ||
          "Please select an agent before starting a new conversation."
      );
      return;
    }
    onSend(inputValue);
  };

  return (
    <div className="w-auto mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted relative">
      {/* 圖片預覽區 */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 px-3 flex-wrap">
          {pendingImages.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img.previewUrl}
                alt={`upload-${index}`}
                className="w-16 h-16 object-cover rounded-lg border border-border"
              />
              {onRemoveImage && (
                <button
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 多行輸入框 */}
      <textarea
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isTranscribing
            ? t("voice.transcribing")
            : isSending
            ? t("conversation.assistant_outputting")
            : t("conversation.input_placeholder")
        }
        disabled={isTranscribing}
        className="
          flex-1 bg-muted px-3 py-2 text-sm leading-6
          resize-y overflow-auto focus-visible:outline-none
          disabled:opacity-50
        "
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) {
              handleSend();
            }
          }
        }}
      />

      {/* 下半部：Agent 選單（左）+ 工具按鈕 + 送出（右） */}
      <div className="flex items-center justify-between px-2">
        {/* 左側：Agent 選單 */}
        <div>
          {showAgentSelect && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between min-w-[140px]"
                >
                  {currentSelectedAgent
                    ? currentSelectedAgent.agent_name
                    : t("agent.select_title") || "Select Agent"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {agentList.map((agent) => (
                  <DropdownMenuItem
                    key={agent.agent_uid}
                    onClick={() => setCurrentSelectedAgent(agent)}
                  >
                    {agent.agent_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 右側：麥克風 + 錄音計時 + 圖片上傳 + 送出按鈕 */}
        <div className="flex items-center gap-1">
          {/* 錄音計時器 */}
          {isRecording && (
            <span className="text-xs text-red-500 font-mono mr-1">
              {recordingSeconds}s / {MAX_RECORDING_SECONDS}s
            </span>
          )}

          {/* 麥克風按鈕 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`rounded-lg h-8 w-8 ${
              isRecording
                ? "text-red-500 bg-red-100 animate-pulse"
                : isTranscribing
                ? "opacity-50"
                : ""
            }`}
            title={
              isRecording
                ? t("voice.stop_recording")
                : isTranscribing
                ? t("voice.transcribing")
                : t("voice.start_recording")
            }
          >
            {isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* 圖片上傳按鈕 */}
          {onUploadImage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || pendingImages.length >= MAX_IMAGES}
                className="rounded-lg h-8 w-8"
                title={`Upload image (${pendingImages.length}/${MAX_IMAGES})`}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}

          {/* 送出按鈕 */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="rounded-xl px-3 py-2 h-fit"
          >
            {isLoading ? t("conversation.sending") : "→"}
          </Button>
        </div>
      </div>
    </div>
  );
}
