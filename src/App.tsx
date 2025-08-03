import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import { RootStackParamList } from './types/navigation';
import AddTodoScreen from './screens/AddTodoScreen';
import EditTodoScreen from './screens/EditTodoScreen';


const Stack = createStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function App() {
  return (
    //Query provider to manage query state
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{title: 'My To-Do List' }}  />
        <Stack.Screen 
          name="AddTodo" 
          component={AddTodoScreen} 
          options={{ title: 'Add New Todo' }}
        />
        <Stack.Screen 
          name="EditTodo" 
          component={EditTodoScreen} 
          options={{ title: 'Edit Todo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;

