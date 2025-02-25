"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { format } from "date-fns";
import { Todo, Template } from "@/lib/types";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface TodoContextType {
  templates: Template[];
  selectedDate: Date;
  selectedTodo: Todo | null;
  addTodo: (content: string, templateId: string) => void;
  deleteTodo: (id: string, templateId: string) => void;
  updateTodo: (id: string, content: string, templateId: string) => void;
  toggleTodo: (id: string, templateId: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTodo: (todo: Todo | null) => void;
  reorderTodos: (newOrder: Todo[], templateId: string) => void;
  addTemplate: () => void;
  removeTemplate: (templateId: string) => void;
  updateTemplateInput: (templateId: string, value: string) => void;
  updateTemplateName: (templateId: string, name: string) => void;
  setActiveTemplate: (templateId: string) => void;
  activeTemplate: Template | undefined;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [hasShownAuthWarning, setHasShownAuthWarning] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  
  useEffect(() => {
    if (status === "unauthenticated" && !hasShownAuthWarning) {
      toast.warning("Sign in to save your todos!", { duration: 6000 });
      setHasShownAuthWarning(true);
    }
  }, [status, hasShownAuthWarning]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetch("/api/templates")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load templates");
          return res.json();
        })
        .then((data) => {
          if (data.length === 0) {
            // Create default "Main" template for new users
            return fetch("/api/templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Main" }),
            }).then((res) => res.json());
          }
          return data;
        })
        .then((templates) => {
          const templatesArray = Array.isArray(templates) ? templates : [templates];
          // Ensure at least one template is active
          const hasActiveTemplate = templatesArray.some(t => t.isActive);
          if (!hasActiveTemplate && templatesArray.length > 0) {
            templatesArray[0].isActive = true;
          }
          setTemplates(templatesArray);
        })
        .catch((error) => {
          console.error("Failed to load templates:", error);
          toast.error("Failed to load templates");
        });
    } else if (status === "unauthenticated") {
      const savedTemplates = localStorage.getItem("todoTemplates");
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        const hasActiveTemplate = parsedTemplates.some((t: { isActive: any; }) => t.isActive);
        if (!hasActiveTemplate && parsedTemplates.length > 0) {
          parsedTemplates[0].isActive = true;
        }
        setTemplates(parsedTemplates);
      } else {
        const initialTemplate: Template = {
          id: crypto.randomUUID(),
          name: "Main",
          date: format(new Date(), "yyyy-MM-dd"),
          newTodo: "",
          todos: [],
          isActive: true,
        };
        setTemplates([initialTemplate]);
      }
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      localStorage.setItem("todoTemplates", JSON.stringify(templates));
    }
  }, [templates, status]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (selectedDate.getDate() !== now.getDate()) {
        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(timer);
  }, [selectedDate]);

  const addTodo = async (content: string, templateId: string) => {
    if (status === "unauthenticated" && !hasShownAuthWarning) {
      toast.warning("Sign in to save your todos!", { duration: 6000 });
      setHasShownAuthWarning(true);
    }

    try {
      if (status === "authenticated" && session?.user?.id) {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            templateId,
            date: format(selectedDate, "yyyy-MM-dd"),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add todo");
        }

        const newTodo = await response.json();
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === templateId
              ? { ...template, todos: [...template.todos, newTodo] }
              : template
          )
        );
        // toast.success("Todo added successfully!");
      } else {
        // Fallback to local storage
        const newTodo = {
          id: crypto.randomUUID(),
          content,
          completed: false,
          date: format(selectedDate, "yyyy-MM-dd"),
          createdAt: new Date().toISOString(),
          templateId,
        };
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === templateId
              ? { ...template, todos: [...template.todos, newTodo] }
              : template
          )
        );
      }
    } catch (error) {
      console.error("Add todo error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add todo"
      );
    }
  };

  const deleteTodo = async (id: string, templateId: string) => {
    try {
      if (status === "authenticated" && session?.user?.id) {
        const response = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete todo");
        }
      }

      setTemplates((prev) =>
        prev.map((template) =>
          template.id === templateId
            ? {
                ...template,
                todos: template.todos.filter((todo) => todo.id !== id),
              }
            : template
        )
      );
      setSelectedTodo(null);
      // toast.success("Todo deleted successfully!");
    } catch (error) {
      console.error("Delete todo error:", error);
      toast.error("Failed to delete todo");
    }
  };

  const updateTodo = (id: string, content: string, templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? {
              ...template,
              todos: template.todos.map((todo) =>
                todo.id === id
                  ? { ...todo, content, updatedAt: new Date().toISOString() }
                  : todo
              ),
            }
          : template
      )
    );
  };

  const toggleTodo = async (id: string, templateId: string) => {
    try {
      if (status === "authenticated" && session?.user?.id) {
        const todo = templates
          .find((t) => t.id === templateId)
          ?.todos.find((t) => t.id === id);

        if (!todo) return;

        const response = await fetch("/api/todos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            completed: !todo.completed,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update todo");
        }

        const updatedTodo = await response.json();
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  todos: template.todos.map((t) =>
                    t.id === id ? updatedTodo : t
                  ),
                }
              : template
          )
        );
      } else {
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  todos: template.todos.map((t) =>
                    t.id === id ? { ...t, completed: !t.completed } : t
                  ),
                }
              : template
          )
        );
      }
    } catch (error) {
      console.error("Toggle todo error:", error);
      toast.error("Failed to update todo");
    }
  };

  const reorderTodos = (newOrder: Todo[], templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId ? { ...template, todos: newOrder } : template
      )
    );
  };

  const addTemplate = async () => {
    try {
      if (status === "authenticated" && session?.user?.id) {
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Template ${templates.length + 1}`,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        const newTemplate = await response.json();
        setTemplates((prev) =>
          prev.map((t) => ({ ...t, isActive: false })).concat(newTemplate)
        );
      } else {
        // Local storage fallback
        const newTemplate: Template = {
          id: crypto.randomUUID(),
          name: `Template ${templates.length + 1}`,
          date: format(selectedDate, "yyyy-MM-dd"),
          newTodo: "",
          todos: [],
          isActive: true,
        };
        setTemplates((prev) =>
          prev.map((t) => ({ ...t, isActive: false })).concat(newTemplate)
        );
      }
    } catch (error) {
      console.error("Add template error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add template"
      );
    }
  };

  const removeTemplate = async (templateId: string) => {
    try {
      if (status === "authenticated" && session?.user?.id) {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete template");
        }
      }

      setTemplates((prev) => {
        const filtered = prev.filter((template) => template.id !== templateId);
        // If we're deleting the active template, make the first remaining template active
        if (
          filtered.length > 0 &&
          prev.find((t) => t.id === templateId)?.isActive
        ) {
          filtered[0].isActive = true;
        }
        return filtered;
      });
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error("Delete template error:", error);
      toast.error("Failed to delete template");
    }
  };

  const updateTemplateInput = (templateId: string, value: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId ? { ...template, newTodo: value } : template
      )
    );
  };

  const updateTemplateName = async (templateId: string, name: string) => {
    try {
      if (status === "authenticated" && session?.user?.id) {
        const response = await fetch("/api/templates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: templateId,
            name,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update template");
        }

        const updatedTemplate = await response.json();
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === templateId
              ? { ...template, ...updatedTemplate }
              : template
          )
        );
      } else {
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === templateId ? { ...template, name } : template
          )
        );
      }
    } catch (error) {
      console.error("Update template error:", error);
      toast.error("Failed to update template");
    }
  };

  const setActiveTemplate = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, isActive: true }
          : { ...template, isActive: false }
      )
    );
  };

  const activeTemplate = templates.find((t) => t.isActive);

  return (
    <TodoContext.Provider
      value={{
        templates,
        selectedDate,
        selectedTodo,
        addTodo,
        deleteTodo,
        updateTodo,
        toggleTodo,
        setSelectedDate,
        setSelectedTodo,
        reorderTodos,
        addTemplate,
        removeTemplate,
        updateTemplateInput,
        updateTemplateName,
        setActiveTemplate,
        activeTemplate,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error("useTodo must be used within a TodoProvider");
  }
  return context;
};
