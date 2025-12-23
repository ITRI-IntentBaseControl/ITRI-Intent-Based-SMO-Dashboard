"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getConversationHistory } from "@/app/service/conversation/ExternalService/apiService";
import { useLocale } from "@/components/LocaleProvider";

/**
 * 匯出對話對話框元件
 * @param {Object} props
 * @param {boolean} props.open - 對話框是否開啟
 * @param {function} props.onOpenChange - 對話框開關狀態變更回調
 * @param {Object} props.conversation - 要匯出的對話物件 { conversation_uid, conversation_name }
 */
export function ExportConversationDialog({ open, onOpenChange, conversation }) {
  const [fileName, setFileName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLocale();

  // 當對話框開啟時，設定預設檔名
  React.useEffect(() => {
    if (open && conversation) {
      const defaultName = conversation.conversation_name || "對話紀錄";
      setFileName(defaultName);
    }
  }, [open, conversation]);

  // 關閉對話框並重置狀態
  const handleClose = () => {
    onOpenChange(false);
    setFileName("");
  };

  // 格式化對話內容為可讀文字
  const formatConversationContent = (messages) => {
    return messages
      .map((item) => {
        const role =
          item.role === "user" ? t("role.user") : t("role.assistant");
        const content = Array.isArray(item.text_content)
          ? item.text_content.join("\n")
          : item.text_content;
        const reward = item.reward
          ? ` [${t("role.rating")} : ${item.reward}]`
          : "";
        return `[${role}]${reward}\n${content}`;
      })
      .join("\n\n" + "=".repeat(50) + "\n\n");
  };

  // 觸發瀏覽器下載
  const downloadFile = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 執行匯出
  const handleExport = async () => {
    if (!conversation || !fileName.trim()) return;

    setIsExporting(true);
    try {
      const result = await getConversationHistory(
        conversation.conversation_uid
      );

      if (result.status_code === 200 && result.data) {
        // 建立匯出資料
        const exportData = {
          conversation_uid: conversation.conversation_uid,
          conversation_name: conversation.conversation_name,
          exported_at: new Date().toISOString(),
          messages: result.data,
          formatted_text: formatConversationContent(result.data),
        };

        // 下載檔案
        downloadFile(exportData, `${fileName.trim()}.json`);
        handleClose();
      } else {
        alert(t("export.export_failed") + (result.message || "未知錯誤"));
      }
    } catch (error) {
      console.error("匯出對話失敗:", error);
      alert(t("export.export_failed_retry"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("export.title")}</DialogTitle>
          <DialogDescription>{t("export.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="export-filename">{t("export.filename")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="export-filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={t("export.placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isExporting) {
                    handleExport();
                  }
                }}
              />
              <span className="text-muted-foreground">.json</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            {t("export.cancel")}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !fileName.trim()}
          >
            {isExporting ? t("export.exporting") : t("export.export")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
