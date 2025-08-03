// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { 
//   fetchTodos, 
//   addTodo as apiAddTodo, 
//   updateTodo as apiUpdateTodo, 
//   deleteTodo as apiDeleteTodo 
// } from '../api/todoService';
// import { Todo, TodosApiResponse } from '../types/todos';

// export const useTodos = () => {
//   const queryClient = useQueryClient();
  
//   const { 
//     data: todosResponse, 
//     isLoading, 
//     isError, 
//     error,
//     refetch
//   } = useQuery<TodosApiResponse>({
//     queryKey: ['todos'],
//     queryFn: fetchTodos
//   });

//   // Ensure we always return an array
//   const todos = todosResponse?.todos || [];

//   const addMutation = useMutation({
//     mutationFn: apiAddTodo,
//     onSuccess: (newTodo) => {
//       queryClient.setQueryData<TodosApiResponse>(['todos'], (oldData) => {
//         return {
//           ...(oldData || { todos: [], total: 0, skip: 0, limit: 0 }),
//           todos: [...(oldData?.todos || []), newTodo],
//           total: (oldData?.total || 0) + 1
//         };
//       });
//     }
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({ id, data }: { id: number; data: Partial<Todo> }) => 
//       apiUpdateTodo(id, data),
//     onSuccess: (updatedTodo) => {
//       queryClient.setQueryData<TodosApiResponse>(['todos'], (oldData) => {
//         if (!oldData) return oldData;
//         return {
//           ...oldData,
//           todos: oldData.todos.map(todo => 
//             todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
//           )
//         };
//       });
//     }
//   });

//   const deleteMutation = useMutation({
//     mutationFn: apiDeleteTodo,
//     onSuccess: (_, id) => {
//       queryClient.setQueryData<TodosApiResponse>(['todos'], (oldData) => {
//         if (!oldData) return oldData;
//         return {
//           ...oldData,
//           todos: oldData.todos.filter(todo => todo.id !== id),
//           total: oldData.total - 1
//         };
//       });
//     }
//   });

//   return {
//     todos, // Always an array
//     isLoading,
//     isError,
//     error,
//     refetch,
//     addTodo: addMutation.mutateAsync,
//     updateTodo: updateMutation.mutateAsync,
//     deleteTodo: deleteMutation.mutate
//   };
// };

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchTodos, 
  addTodo as apiAddTodo, 
  updateTodo as apiUpdateTodo, 
  deleteTodo as apiDeleteTodo 
} from '../api/todoService';
import { Todo } from '../types/todos';

export const useTodos = () => {
  const queryClient = useQueryClient();
  
  const { 
    data: todos = [], 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addMutation = useMutation({
    mutationFn: apiAddTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Todo> }) => apiUpdateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  return {
    todos,
    isLoading,
    isError,
    error,
    refetch,
    addTodo: addMutation.mutateAsync,
    updateTodo: updateMutation.mutateAsync,
    deleteTodo: deleteMutation.mutate
  };
};