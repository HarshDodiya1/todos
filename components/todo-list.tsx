"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTodo } from "@/lib/todo-context";
import { Todo } from "@/lib/types";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

function SortableTodoItem({ todo, index, isSelected, templateId }: { 
  todo: Todo; 
  index: number; 
  isSelected: boolean;
  templateId: string;
}) {
  const { toggleTodo, setSelectedTodo, selectedTodo, deleteTodo } = useTodo();
  const itemRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isSelected]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group flex items-center gap-3 rounded-lg border-2 p-4 hover:border-primary/50 transition-all duration-200 outline-none shadow-sm hover:shadow-md ${
        selectedTodo?.id === todo.id
          ? "border-primary bg-primary/5"
          : "border-border"
      }`}
      tabIndex={0}
      role="listitem"
      aria-selected={isSelected}
      data-index={index}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setSelectedTodo(todo);
        } else if (e.key === "ArrowUp" && index > 0) {
          e.preventDefault();
          const prevElement = document.querySelector(`[data-index="${index - 1}"]`) as HTMLElement;
          if (prevElement) {
            prevElement.focus();
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextElement = document.querySelector(`[data-index="${index + 1}"]`) as HTMLElement;
          if (nextElement) {
            nextElement.focus();
          }
        }
      }}
      onFocus={() => setSelectedTodo(todo)}
    >
      <div {...listeners} className="cursor-grab hover:text-primary transition-colors">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => toggleTodo(todo.id, templateId)}
        className="transition-all duration-200 hover:scale-110"
      />
      <div
        className={`flex-1 cursor-pointer transition-colors hover:text-primary ${
          todo.completed ? "text-muted-foreground line-through" : ""
        }`}
      >
        {todo.content}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => deleteTodo(todo.id, templateId)}
        className="opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/90" />
      </Button>
    </motion.div>
  );
}

interface TodoListProps {
  templateId: string;
}

export function TodoList({ templateId }: TodoListProps) {
  const { templates, selectedDate, reorderTodos, selectedTodo } = useTodo();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentTemplate = templates.find(t => t.id === templateId);
  const filteredTodos = currentTemplate?.todos.filter(
    (todo) => todo.date === format(selectedDate, "yyyy-MM-dd")
  ) || [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredTodos.findIndex((t) => t.id === active.id);
      const newIndex = filteredTodos.findIndex((t) => t.id === over.id);
      const newTodos = arrayMove(filteredTodos, oldIndex, newIndex);
      reorderTodos(newTodos, templateId);
    }
  };

  return (
    <div className="space-y-4" role="list">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTodos.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {filteredTodos.map((todo, index) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
                index={index}
                isSelected={selectedTodo?.id === todo.id}
                templateId={templateId}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
      {filteredTodos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No todos for this day. Add one to get started!
        </div>
      )}
    </div>
  );
}
