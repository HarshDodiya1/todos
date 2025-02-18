"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { TodoList } from "@/components/todo-list";
import { KeyBindingsDialog } from "@/components/key-bindings-dialog";
import { Input } from "@/components/ui/input";
import { useTodo } from "@/lib/todo-context";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KeyboardIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserMenu } from "@/components/user-menu";

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [showKeyBindings, setShowKeyBindings] = useState(false);
  const {
    selectedDate,
    setSelectedDate,
    addTodo,
    deleteTodo,
    updateTodo,
    selectedTodo,
    setSelectedTodo,
    templates,
    addTemplate,
    removeTemplate,
    updateTemplateInput,
    updateTemplateName,
    setActiveTemplate,
    activeTemplate,
  } = useTodo();

  const handleTemplateKeyDown = (
    e: React.KeyboardEvent,
    template: { id: string; newTodo: string }
  ) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (template.newTodo.trim()) {
        addTodo(template.newTodo, template.id);
        updateTemplateInput(template.id, "");
        toast.success("Todo added successfully!");
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowKeyBindings(true);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedTodo(null);
        setShowKeyBindings(false);
      }

      if (selectedTodo) {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          deleteTodo(selectedTodo.id, selectedTodo.templateId);
          toast.success("Todo deleted successfully!");
        }

        if (e.key === "Enter" && e.ctrlKey) {
          e.preventDefault();
          const updatedContent = prompt("Edit todo:", selectedTodo.content);
          if (updatedContent !== null) {
            updateTodo(
              selectedTodo.id,
              updatedContent,
              selectedTodo.templateId
            );
            toast.success("Todo updated successfully!");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTodo, deleteTodo, updateTodo, setSelectedTodo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto max-w-5xl py-8 px-4"
    >
      <div className="mb-8 flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent"
        >
          Todo App
        </motion.h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowKeyBindings(true)}
            className="relative hover:scale-105 transition-transform"
          >
            <KeyboardIcon className="h-4 w-4" />
          </Button>
          <UserMenu />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[350px_1fr]">
        <div className="h-fit">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 max-h-[calc(100vh-12rem)] overflow-auto">
          <CardHeader className="sticky top-0 bg-background z-10 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg font-medium">Tasks</CardTitle>
                <Select
                  value={activeTemplate?.id}
                  onValueChange={(value) => setActiveTemplate(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem 
                        key={template.id}
                        value={template.id}
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => addTemplate()}
                className="text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {templates.filter(t => t.isActive).map((template) => (
              <div
                key={template.id}
                className="space-y-4 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={template.name}
                    onChange={(e) => updateTemplateName(template.id, e.target.value)}
                    className="w-[200px] text-lg font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTemplate(template.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a new todo..."
                    value={template.newTodo}
                    onChange={(e) =>
                      updateTemplateInput(template.id, e.target.value)
                    }
                    className="flex-1"
                    onKeyDown={(e) => handleTemplateKeyDown(e, template)}
                  />
                  <Button
                    onClick={() => addTodo(template.newTodo, template.id)}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <TodoList templateId={template.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <KeyBindingsDialog
        open={showKeyBindings}
        onOpenChange={setShowKeyBindings}
      />
    </motion.div>
  );
}
