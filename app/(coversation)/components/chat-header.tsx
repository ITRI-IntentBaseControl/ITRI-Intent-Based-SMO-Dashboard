"use client";

import React, { memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// 你若沒有這些圖示或組件，可以在此檔案自行改成 <svg>
import { PlusIcon, VercelIcon } from "./chat/icons";
import { ModelSelector } from "@/components/model-selector";
import {
  VisibilitySelector,
  VisibilityType,
} from "@/components/visibility-selector";
import { SidebarToggle } from "@/components/sidebar-toggle";

interface ChatHeaderProps {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 gap-2">
      {/* 側邊攔按鈕 */}
      <SidebarToggle />

      {/* 返回或新對話按鈕 */}
      <Button
        variant="outline"
        className="px-2 ml-auto"
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
      >
        <PlusIcon />
        <span className="md:sr-only">New Chat</span>
      </Button>

      {/* 若非只讀，允許切換Model */}
      {!isReadonly && (
        <ModelSelector selectedModelId={selectedModelId} className="order-1" />
      )}

      {/* 若非只讀，可切換 Visibility */}
      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1"
        />
      )}

      {/* 最右邊: Deploy with Vercel */}
      <Button className="bg-zinc-900 text-zinc-50 hidden md:flex py-1.5 px-2">
        <VercelIcon size={16} />
        Deploy with Vercel
      </Button>
    </header>
  );
}

// 透過 memo + shallow compare props
export const ChatHeader = memo(PureChatHeader);
