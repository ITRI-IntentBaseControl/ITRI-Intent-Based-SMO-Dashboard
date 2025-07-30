"use client";

import React from "react";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/icons";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { useWindowSize } from "usehooks-ts";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
export function ConversationHeader() {
  const router = useRouter();

  // next-themes：避免 SSR/CSR 不一致，等掛載後再讀取主題
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true; // 初始先假設為 dark，避免抖動
  const nextTheme = isDark ? "light" : "dark";

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
          >
            <PlusIcon />
            <span className="md:sr-only">New Chat</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Chat</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Switch to ${nextTheme} mode`}
            onClick={() => setTheme(nextTheme)}
          >
            {/* 掛載後再顯示正確圖示，未掛載先渲染一個占位避免布局跳動 */}
            {mounted ? (
              isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )
            ) : (
              <span className="inline-block w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{`Switch to ${
          nextTheme === "dark" ? "Dark" : "Light"
        } Mode`}</TooltipContent>
      </Tooltip>
    </header>
  );
}
