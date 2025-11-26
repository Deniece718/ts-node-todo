import { Todo } from './types';

const todos: Map<string, Todo> = new Map();

export function listTodos(): Todo[] {
  return Array.from(todos.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getTodo(id: string): Todo | undefined {
  return todos.get(id);
}

export function saveTodo(todo: Todo): void {
  todos.set(todo.id, todo);
}

export function deleteTodo(id: string): boolean {
  return todos.delete(id);
}
