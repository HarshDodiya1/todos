export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  date: string;
  createdAt: string;
  updatedAt?: string;
  templateId: string;
}

export interface Template {
  id: string;
  name: string;
  date: string;
  newTodo: string;
  todos: Todo[];
  isActive: boolean;
}

export interface KeyBindings {
  key: string;
  description: string;
}