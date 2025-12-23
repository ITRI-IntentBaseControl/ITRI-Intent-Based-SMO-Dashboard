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
import { useLocale } from "@/components/LocaleProvider";

export function EditAgentDialog({
  open,
  onOpenChange,
  agent,
  onUpdateSuccess,
}) {
  const [agentName, setAgentName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (agent) {
      setAgentName(agent.agent_name || "");
      setApiKey("");
    }
  }, [agent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agentName.trim()) {
      toast.error(t("agent.name_required"));
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
          <DialogTitle>{t("agent.update_title")}</DialogTitle>
          <DialogDescription>{t("agent.update_description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-agent-name">{t("agent.name")}</Label>
              <Input
                id="edit-agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={t("agent.placeholder_name")}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-api-key">
                {t("agent.api_key_optional_label")}
              </Label>
              <Input
                id="edit-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("agent.api_key_edit_placeholder")}
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
              {isSubmitting ? t("agent.updating") : t("agent.update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
