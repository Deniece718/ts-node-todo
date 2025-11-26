export type Todo = {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: string;
    updatedAt?: string;
}

export type CreateTodoDto = Pick<Todo, 'title' | 'description'>;

export type UpdateTodoDto = Partial<Pick<Todo, 'title' | 'description' | 'completed'>>;
