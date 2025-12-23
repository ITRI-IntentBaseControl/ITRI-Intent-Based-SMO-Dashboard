"use client";

import { useState } from "react";
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
import { useLocale } from "@/components/LocaleProvider";

export function CreateAgentDialog({ open, onOpenChange, onCreateSuccess }) {
  const [agentName, setAgentName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLocale();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agentName.trim() || !apiKey.trim()) {
      toast.error(t("agent.please_fill_fields"));
      return;
    }

    setIsSubmitting(true);
    const success = await onCreateSuccess(agentName, apiKey);
    setIsSubmitting(false);

    if (success) {
      // Reset form on success
      setAgentName("");
      setApiKey("");
      // 父組件會處理關閉對話框
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("agent.create_title")}</DialogTitle>
          <DialogDescription>{t("agent.create_description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agent-name">{t("agent.name")}</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={t("agent.placeholder_name")}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-key">{t("agent.api_key")}</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("agent.placeholder_api_key")}
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
              {t("agent.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("agent.creating") : t("agent.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
