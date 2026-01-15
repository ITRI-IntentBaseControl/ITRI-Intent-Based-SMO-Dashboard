"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useAgentManager } from "@/app/hooks/agent/useAgentManager";

export function ConversationInput({
  inputValue,
  onChange,
  onSend,
  isLoading,
  isSending = false, // true = 仍可打字，但禁止送出
  showAgentSelect = false,
  selectedAgent = null,
  onSelectAgent = null,
  preSelectedAgentUid = null,
}) {
  const { t } = useLocale();
  const { agentList } = useAgentManager();
  const [internalSelectedAgent, setInternalSelectedAgent] = useState(null);

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

  return (
    <div className="w-auto mx-auto py-4 flex flex-col gap-2 rounded-2xl border border-border bg-muted relative">
      {/* 上半部：多行輸入框 —— 修改 disabled 屬性 */}
      <textarea
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isSending
            ? t("conversation.assistant_outputting")
            : t("conversation.input_placeholder")
        }
        className="
          flex-1 bg-muted px-3 py-2 text-sm leading-6
          resize-y overflow-auto focus-visible:outline-none
        "
        // 只要 isSending，就完全禁止 Enter 送出；但可繼續打字與 Shift+Enter 換行
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isSending && inputValue.trim() !== "") {
              if (showAgentSelect && !currentSelectedAgent) {
                toast.error(
                  t("agent.select_required_full") ||
                    "Please select an agent before starting a new conversation."
                );
                return;
              }
              onSend(inputValue);
            }
          }
        }}
      />

      {/* 下半部：送出按鈕 —— 仍照 isSending 鎖住 */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (isSending || inputValue.trim() === "") return;
            if (showAgentSelect && !currentSelectedAgent) {
              toast.error(
                t("agent.select_required_full") ||
                  "Please select an agent before starting a new conversation."
              );
              return;
            }
            onSend(inputValue);
          }}
          disabled={
            isLoading ||
            !inputValue.trim() ||
            isSending ||
            (showAgentSelect && !currentSelectedAgent)
          }
          className="rounded-xl px-3 py-2 h-fit mt-2 mr-2"
        >
          {isLoading ? t("conversation.sending") : "→"}
        </Button>
      </div>

      {/* Agent Select Dropdown fixed at bottom left */}
      {showAgentSelect && (
        <div className="absolute left-2 bottom-2 z-10">
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
        </div>
      )}
    </div>
  );
}
