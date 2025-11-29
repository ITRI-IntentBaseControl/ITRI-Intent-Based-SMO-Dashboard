"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function EditAgentDialog({
  open,
  onOpenChange,
  agent,
  onUpdateSuccess,
}) {
  const [agentName, setAgentName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (agent) {
      setAgentName(agent.agent_name || "");
      setApiKey("");
    }
  }, [agent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agentName.trim()) {
      toast.error("Agent 名稱不能為空");
      return;
    }

    setIsSubmitting(true);
    const success = await onUpdateSuccess(
      agent.agent_uid,
      agentName,
      apiKey || undefined
    );
    setIsSubmitting(false);

    if (success) {
      // Reset API key field and close dialog only on success
      setApiKey("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯 Agent</DialogTitle>
          <DialogDescription>
            更新 Agent 名稱或 API Key（留空則不更新 API Key）
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-agent-name">Agent 名稱</Label>
              <Input
                id="edit-agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="輸入 Agent 名稱"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-api-key">API Key（選填）</Label>
              <Input
                id="edit-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="輸入新的 API Key（留空則不更新）"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
