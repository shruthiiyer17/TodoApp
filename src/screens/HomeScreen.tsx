import React, { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator, Text, View, StyleSheet, TouchableOpacity, Pressable, Button, Platform, PermissionsAndroid } from 'react-native';
import { useTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import { Todo } from '../types/todos';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { resetTodoSystem } from '../api/todoService';
import PushNotification from 'react-native-push-notification';
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen = ({ navigation }: Props) => {
  const { 
    todos, 
    isLoading, 
    isError, 
    error, 
    refetch,
    addTodo, 
    updateTodo, 
    deleteTodo 
  } = useTodos();
  
  const [dueDates, setDueDates] = useState<Record<number, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load due dates
        const keys = await AsyncStorage.getAllKeys();
        const dueDateKeys = keys.filter(key => key.startsWith('dueDate_'));
        const storedDueDates = await AsyncStorage.multiGet(dueDateKeys);
        
        const dueDatesMap = storedDueDates.reduce((acc, [key, value]) => {
          if (value) {
            const todoId = parseInt(key.replace('dueDate_', ''));
            acc[todoId] = value;
          }
          return acc;
        }, {} as Record<number, string>);
        
        setDueDates(dueDatesMap);
        
        // Load hideCompleted preference
        const hidePref = await AsyncStorage.getItem('hideCompleted');
        if (hidePref !== null) {
          setHideCompleted(JSON.parse(hidePref));
        }
      } catch (e) {
        console.error('Failed to load preferences', e);
      }
    };
    
    loadPreferences();
  }, []);

  // Save preferences
  useEffect(() => {
    AsyncStorage.setItem('hideCompleted', JSON.stringify(hideCompleted));
  }, [hideCompleted]);

  // Merge todos with local due dates
  const mergedTodos = todos.map(todo => ({
    ...todo,
    dueDate: dueDates[todo.id] || todo.dueDate
  }));

  // Filter based on hideCompleted setting
  const filteredTodos = hideCompleted 
    ? mergedTodos.filter(todo => !todo.completed)
    : mergedTodos;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleAddTodo = async (newTodo: Omit<Todo, 'id'>) => {
    try {
      // Add userId required by API
      const todoWithUserId = { ...newTodo, userId: 1 };
      const addedTodo = await addTodo(todoWithUserId);
      
      // Save due date locally if it exists
      if (newTodo.dueDate) {
        await AsyncStorage.setItem(`dueDate_${addedTodo.id}`, newTodo.dueDate);
        setDueDates(prev => ({ ...prev, [addedTodo.id]: newTodo.dueDate as string }));
      }
      
      showMessage({
        message: 'Todo added!',
        type: 'success',
      });
    } catch (e: any) {
      showMessage({
        message: 'Failed to add todo',
        description: e.message,
        type: 'danger',
      });
      throw e;
    }
  };

  const handleUpdateTodo = async (id: number, data: Partial<Todo>) => {
    try {
      await updateTodo({ id, data });
      
      // Update due date locally
      if (data.dueDate !== undefined) {
        if (data.dueDate) {
          await AsyncStorage.setItem(`dueDate_${id}`, data.dueDate);
          setDueDates(prev => ({ ...prev, [id]: data.dueDate as string }));
        } else {
          await AsyncStorage.removeItem(`dueDate_${id}`);
          setDueDates(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
          });
        }
      }
      
      showMessage({
        message: 'Todo updated!',
        type: 'success',
      });
    } catch (e: any) {
      showMessage({
        message: 'Failed to update todo',
        description: e.message,
        type: 'danger',
      });
      throw e;
    }
  };

// Helper to remove due date from AsyncStorage and local state
const removeDueDate = async (id: number) => {
  await AsyncStorage.removeItem(`dueDate_${id}`);
  setDueDates(prev => {
    const newState = { ...prev };
    delete newState[id];
    return newState;
  });
};

const handleDelete = async (id: number) => {
  try {
    await deleteTodo(id);
    await removeDueDate(id);
    
    showMessage({
      message: 'Todo deleted!',
      type: 'success',
    });
  } catch (e: any) {
    showMessage({
      message: 'Failed to delete todo',
      description: e.message,
      type: 'danger',
    });
  }
};

  const toggleHideCompleted = () => {
    setHideCompleted(prev => !prev);
  };

    const handleResetSystem = async () => {
    try {
      await resetTodoSystem();
      
      // Clear local state
      setDueDates({});
      setHideCompleted(false);
      
      // Refetch todos (will get fresh API data)
      await refetch();
      
      showMessage({
        message: 'Todo system reset successfully',
        type: 'success',
      });
    } catch (e: any) {
      showMessage({
        message: 'Reset failed',
        description: e.message,
        type: 'danger',
      });
    }
  };


  // Calculate stats
  const totalCount = mergedTodos.length;
  const completedCount = mergedTodos.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;

  if (isLoading && todos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading todos...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error: {error?.message || 'Failed to load todos'}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Updated Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.hideButton}
          onPress={toggleHideCompleted}
        >
          <Icon 
            name={hideCompleted ? 'visibility-off' : 'visibility'} 
            size={24} 
            color="#4CAF50" 
          />
          <Text style={styles.hideButtonText}>
            {hideCompleted ? 'Show Completed' : 'Hide Completed'}
          </Text>
        </TouchableOpacity>
        <Button
          title="Deep Test Notification"
          onPress={async () => {
            console.log('Attempting to show notification...');
            
            // 1. Verify channel exists
            PushNotification.getChannels(channels => {
              console.log('Existing channels:', channels);
            });

            // 2. Check permissions
            if (Platform.OS === 'android') {
              const status = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
              );
              console.log('Permission status:', status);
            }

            // 3. Try different notification types
            try {
              // Immediate notification
              PushNotification.localNotification({
                channelId: "todo_reminders",
                id: 'TEST_123', // Required for Android
                title: "URGENT TEST",
                message: "You should definitely see this",
                playSound: true,
                soundName: 'default',
                vibrate: true,
                vibration: 1000,
                importance: 'high', // Android only
                priority: 'high', // Android only
              });

              console.log('Notification should be visible now');
            } catch (error) {
              console.error('Notification error:', error);
            }
          }}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.completedText]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.pendingText]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <TodoItem 
            todo={item}
            onToggleCompletion={() => 
              handleUpdateTodo(item.id, { completed: !item.completed })
            }
            onDelete={() => handleDelete(item.id)}
            onEdit={() => navigation.navigate('EditTodo', {
              todo: item,
              onSave: (updatedTodo) => 
                handleUpdateTodo(item.id, updatedTodo)
            })}
            // Make sure your TodoItem component accepts and renders a delete icon
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={60} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              {hideCompleted && completedCount > 0
                ? "All tasks completed!"
                : "No tasks yet"
              }
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate('AddTodo', { onSave: handleAddTodo })}
            >
              <Icon name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Task</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      
      {/* Floating Action Button */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddTodo', { onSave: handleAddTodo })}
      >
        <Icon name="add" size={24} color="white" />
      </Pressable>

      {/* Reset Button (less prominent) */}
      <Pressable 
        style={styles.resetButton}
        onPress={handleResetSystem}
      >
        <Icon name="restore" size={20} color="#FF0000" />
        <Text style={styles.resetButtonText}>Reset System</Text>
      </Pressable>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  completedText: {
    color: '#4CAF50',
  },
  pendingText: {
    color: '#FF9800',
  },
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  hideButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#757575',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  resetButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FF0000',
    marginLeft: 5,
  },
});

export default HomeScreen;