"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyBindings } from "@/lib/types";

const keyBindings: KeyBindings[] = [
  { key: "Enter", description: "Add a new todo" },
  { key: "Delete / Backspace", description: "Remove selected todo" },
  { key: "Ctrl + Enter", description: "Edit selected todo" },
  { key: "Shift + Enter", description: "Add new line within todo" },
  { key: "↑ / ↓", description: "Navigate between todos" },
  { key: "Space / Enter", description: "Select/deselect todo" },
  { key: "Tab", description: "Move to next interactive element" },
  { key: "Shift + Tab", description: "Move to previous interactive element" },
  { key: "Esc", description: "Deselect todo or close dialog" },
  { key: "?", description: "Show this help dialog" },
];

interface KeyBindingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyBindingsDialog({
  open,
  onOpenChange,
}: KeyBindingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {keyBindings.map((binding) => (
            <div
              key={binding.key}
              className="flex items-center justify-between gap-4"
            >
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-sm shadow-sm">
                {binding.key}
              </kbd>
              <span className="text-muted-foreground text-sm">
                {binding.description}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
