// Make userId optional since we handle it in the API service
export type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId?: number;  // Changed to optional
  dueDate?: string;
  isLocal?: boolean;
};

export type TodosApiResponse = {
  todos: Todo[];
  total: number;
  skip: number;
  limit: number;
};

// Define API error structure (optional but recommended)
export interface ApiError {
  message: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}