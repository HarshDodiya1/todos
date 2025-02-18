"use client";

import { ThemeProvider } from "next-themes";
import { TodoProvider } from "@/lib/todo-context";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <TodoProvider>
          {children}
          <Toaster />
        </TodoProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}