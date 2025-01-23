"use client";

import { ReactNode } from "react";
import { ApolloProvider } from "@apollo/client";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { client } from "@/lib/apolloClient";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {/* 這裡也可以放任何只在前端跑的功能，如狀態管理、通知系統等 */}
        <Toaster position="top-center" />
        {children}
      </ThemeProvider>
    </ApolloProvider>
  );
}
