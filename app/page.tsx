"use client";

import { KeyBindingsDialog } from "@/components/key-bindings-dialog";
import { TodoList } from "@/components/todo-list";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserMenu } from "@/components/user-menu";
import { useTodo } from "@/lib/todo-context";
import { Template } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Edit2,
  KeyboardIcon,
  MoreVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
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
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [tempTemplateName, setTempTemplateName] = useState("");

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

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template.id);
    setTempTemplateName(template.name);
  };

  const handleSaveTemplateName = async (templateId: string) => {
    if (tempTemplateName.trim()) {
      await updateTemplateName(templateId, tempTemplateName.trim());
      setEditingTemplate(null);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="container mx-auto max-w-5xl py-6 sm:py-12 px-4"
    >
      <div className="mb-8 sm:mb-12 flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
        >
          Todo App
        </motion.h1>
        <div className="flex items-center gap-2 sm:gap-4">
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

      <motion.div
        className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-[350px_1fr]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <div className="h-fit">
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-medium tracking-tight">
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md w-full"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <CardTitle className="text-lg font-medium tracking-tight truncate">
                Tasks
              </CardTitle>
              <div className="flex flex-col gap-3 w-full">
                <Select
                  value={activeTemplate?.id}
                  onValueChange={(value) => setActiveTemplate(value)}
                >
                  <SelectTrigger className="w-full transition-all duration-200 hover:border-primary/50 text-sm">
                    <SelectValue placeholder="Select template" className="truncate" />
                  </SelectTrigger>
                  <SelectContent className="shadow-lg border-2 w-[280px]">
                    {templates.map((template) => (
                      <SelectItem
                        key={template.id}
                        value={template.id}
                        className="cursor-pointer transition-colors hover:bg-primary/5"
                      >
                        <span className="truncate block">{template.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => addTemplate()}
                  className="text-sm hover:border-primary/50 transition-all duration-200 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="truncate">New Template</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {templates
              .filter((t) => t.isActive)
              .map((template) => (
                <div
                  key={template.id}
                  className="space-y-4 p-3 sm:p-6 border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {editingTemplate === template.id ? (
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <Input
                            value={tempTemplateName}
                            onChange={(e) => setTempTemplateName(e.target.value)}
                            className="text-base sm:text-lg font-medium min-w-0"
                            placeholder="Template name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveTemplateName(template.id);
                              } else if (e.key === "Escape") {
                                setEditingTemplate(null);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveTemplateName(template.id)}
                            className="shrink-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="text-base sm:text-lg font-medium truncate">
                          {template.name}
                        </h3>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          <span className="truncate">Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this template?"
                              )
                            ) {
                              removeTemplate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="truncate">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-2 min-w-0">
                    <Input
                      placeholder="Add a new todo..."
                      value={template.newTodo}
                      onChange={(e) =>
                        updateTemplateInput(template.id, e.target.value)
                      }
                      className="flex-1 min-w-0 text-sm"
                      onKeyDown={(e) => handleTemplateKeyDown(e, template)}
                    />
                    <Button
                      onClick={() => addTodo(template.newTodo, template.id)}
                      size="icon"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <TodoList templateId={template.id} />
                </div>
              ))}
          </CardContent>
        </Card>
      </motion.div>

      <KeyBindingsDialog
        open={showKeyBindings}
        onOpenChange={setShowKeyBindings}
      />
    </motion.div>
  );
}
