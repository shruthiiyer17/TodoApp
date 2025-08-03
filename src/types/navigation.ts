import { Todo } from '../types/todos';


export type RootStackParamList = {
  Home: undefined;
  AddTodo: {
    onSave: (newTodo: Omit<Todo, 'id'>) => Promise<void>;
  };
  EditTodo: {
    todo: Todo;
    onSave: (updatedTodo: Partial<Todo>) => Promise<void>;
  };
};
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}