import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '../types/todos';

const API = axios.create({
  baseURL: 'https://dummyjson.com/todos',
  timeout: 10000,
});

// Storage keys
const LOCAL_TODOS_KEY = 'local_todos'; // For todos added while offline
const API_TODOS_CACHE_KEY = 'api_todos_cache'; // Cached API todos
const MODIFIED_TODOS_KEY = 'modified_todos'; // Track modified API todos
const DELETED_TODOS_KEY = 'deleted_todos'; // Track deleted todo IDs

// Helper functions with TypeScript generics
const getData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue ? JSON.parse(jsonValue) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return defaultValue;
  }
};

const storeData = async (key: string, value: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

export const fetchTodos = async (): Promise<Todo[]> => {
  try {
    // 1. Try to get fresh API todos
    let apiTodos: Todo[] = [];
    try {
      const response = await API.get('/?limit=30');
      apiTodos = response.data.todos || [];
      await storeData(API_TODOS_CACHE_KEY, apiTodos);
    } catch (error) {
      console.log('Using cached API todos', error);
      apiTodos = await getData<Todo[]>(API_TODOS_CACHE_KEY, []);
    }

    // 2. Get locally added todos
    const localTodos = await getData<Todo[]>(LOCAL_TODOS_KEY, []);

    // 3. Get modified todos (including completion status changes)
    const modifiedTodos = await getData<Record<number, Partial<Todo>>>(MODIFIED_TODOS_KEY, {});

    // 4. Get deleted todo IDs
    const deletedIds = await getData<number[]>(DELETED_TODOS_KEY, []);

    // Merge all data
    return [
      // API todos with modifications, excluding deleted
      ...apiTodos
        .filter(todo => !deletedIds.includes(todo.id))
        .map(todo => ({
          ...todo,
          ...(modifiedTodos[todo.id] || {}),
          isLocal: false,
        })),
      // Local todos
      ...localTodos.map(todo => ({
        ...todo,
        isLocal: true,
      }))
    ];
  } catch (error) {
    console.error('Error fetching todos', error);
    return [];
  }
};

export const addTodo = async (todo: Omit<Todo, 'id'>): Promise<Todo> => {
  try {
    // Generate a new todo with local ID
    const newTodo: Todo = {
      ...todo,
      id: Date.now(), // Temporary local ID
      userId: 1,
      completed: todo.completed || false,
      isLocal: true,
    };

    // Store locally immediately
    const localTodos = await getData<Todo[]>(LOCAL_TODOS_KEY, []);
    await storeData(LOCAL_TODOS_KEY, [...localTodos, newTodo]);

    // Simulate API response structure
    return {
      ...newTodo
    };
  } catch (error) {
    console.error('Error adding todo', error);
    throw error;
  }
};

export const updateTodo = async (id: number, data: Partial<Todo>): Promise<Todo> => {
  try {
    // Check if it's a local todo
    const localTodos = await getData<Todo[]>(LOCAL_TODOS_KEY, []);
    const localIndex = localTodos.findIndex(t => t.id === id);

    if (localIndex >= 0) {
      // Update local todo
      const updatedTodo = { ...localTodos[localIndex], ...data };
      localTodos[localIndex] = updatedTodo;
      await storeData(LOCAL_TODOS_KEY, localTodos);
      return updatedTodo;
    }

    // For API todos, store modifications
    const modifications = await getData<Record<number, Partial<Todo>>>(MODIFIED_TODOS_KEY, {});
    modifications[id] = { ...modifications[id], ...data };
    await storeData(MODIFIED_TODOS_KEY, modifications);

    // Get the base todo to return complete object
    const apiTodos = await getData<Todo[]>(API_TODOS_CACHE_KEY, []);
    const baseTodo = apiTodos.find(t => t.id === id) || { id, userId: 1, completed: false, todo: "" };

    return {
      ...baseTodo,
      ...modifications[id],
      isLocal: false,
      todo: (modifications[id]?.todo ?? baseTodo.todo ?? ""), // Ensure 'todo' is always a string
      completed: (modifications[id]?.completed ?? baseTodo.completed ?? false), // Ensure 'completed' is always boolean
      userId: (modifications[id]?.userId ?? baseTodo.userId ?? 1), // Ensure 'userId' is always present
    };
  } catch (error) {
    console.error('Error updating todo', error);
    throw error;
  }
};

export const deleteTodo = async (id: number): Promise<void> => {
  try {
    // Check if it's a local todo
    const localTodos = await getData<Todo[]>(LOCAL_TODOS_KEY, []);
    const localIndex = localTodos.findIndex(t => t.id === id);

    if (localIndex >= 0) {
      // Remove from local todos
      const updatedLocalTodos = localTodos.filter(t => t.id !== id);
      await storeData(LOCAL_TODOS_KEY, updatedLocalTodos);
      return;
    }

    // For API todos, mark as deleted
    const deletedIds = await getData<number[]>(DELETED_TODOS_KEY, []);
    if (!deletedIds.includes(id)) {
      await storeData(DELETED_TODOS_KEY, [...deletedIds, id]);
    }

    // Also remove from modifications if present
    const modifications = await getData<Record<number, Partial<Todo>>>(MODIFIED_TODOS_KEY, {});
    if (modifications[id]) {
      delete modifications[id];
      await storeData(MODIFIED_TODOS_KEY, modifications);
    }

    // Remove due date if exists
    await removeDueDate(id);
  } catch (error) {
    console.error('Error deleting todo', error);
    throw error;
  }
};

export const getTodoById = async (id: number): Promise<Todo | null> => {
  try {
    const allTodos = await fetchTodos();
    return allTodos.find(todo => todo.id === id) || null;
  } catch (error) {
    console.error('Error getting todo by ID', error);
    return null;
  }
};

export const resetTodoSystem = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      LOCAL_TODOS_KEY,
      API_TODOS_CACHE_KEY,
      MODIFIED_TODOS_KEY,
      DELETED_TODOS_KEY,
    ]);
    // Clear all due dates
    const keys = await AsyncStorage.getAllKeys();
    const dueDateKeys = keys.filter(key => key.startsWith('dueDate_'));
    if (dueDateKeys.length > 0) {
      await AsyncStorage.multiRemove(dueDateKeys);
    }
  } catch (error) {
    console.error('Error resetting todo system', error);
    throw error;
  }
};

const removeDueDate = async (id: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`dueDate_${id}`);
  } catch (error) {
    console.error(`Error removing due date for todo ${id}`, error);
  }
};

// Optional: Sync local todos with a real backend
export const syncLocalTodos = async (): Promise<void> => {
  try {
    const localTodos = await getData<Todo[]>(LOCAL_TODOS_KEY, []);
    if (localTodos.length === 0) return;

    console.log('Syncing local todos with real backend...');
    // In a real app, you would:
    // 1. Send localTodos to your backend
    // 2. On success, clear LOCAL_TODOS_KEY
    // 3. Update API_TODOS_CACHE with the new data
    
    // For demo purposes, we'll just clear local todos
    await storeData(LOCAL_TODOS_KEY, []);
  } catch (error) {
    console.error('Error syncing local todos', error);
  }
};