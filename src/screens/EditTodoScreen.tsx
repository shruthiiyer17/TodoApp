import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Switch } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import DatePicker from 'react-native-date-picker';
import { scheduleDueDateNotification } from '../notifications'; // Import the function
import PushNotification from 'react-native-push-notification';

type EditTodoScreenRouteProp = RouteProp<RootStackParamList, 'EditTodo'>;
type EditTodoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTodo'>;

interface Props {
  route: EditTodoScreenRouteProp;
  navigation: EditTodoScreenNavigationProp;
}

const EditTodoScreen = ({ route, navigation }: Props) => {
  const { todo, onSave } = route.params;
  const [text, setText] = useState(todo.todo);
  const [completed, setCompleted] = useState(todo.completed);
  const [date, setDate] = useState(todo.dueDate ? new Date(todo.dueDate) : null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    try {
      const updatedTodo = {
        todo: text,
        completed,
        dueDate: date?.toISOString().split('T')[0] || undefined,
      };

      await onSave(updatedTodo);

      // Cancel any existing notification for this todo
      PushNotification.cancelLocalNotification(todo.id.toString());

      // Reschedule if due date exists
      if (date) {
        scheduleDueDateNotification(text, date); // <-- Add this line
      }

      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Todo</Text>
      
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Edit your todo"
        style={styles.input}
        autoFocus
      />
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Completed:</Text>
        <Switch
          value={completed}
          onValueChange={setCompleted}
          trackColor={{ false: '#BDC3C7', true: '#2ECC71' }}
        />
      </View>
      
      <View style={styles.dateContainer}>
        <Button 
          title={date ? "Change Due Date" : "Set Due Date"} 
          onPress={() => setDatePickerOpen(true)} 
          color="#5D6D7E"
        />
        {date && (
          <Text style={styles.dateText}>
            Due: {date.toLocaleDateString()}
          </Text>
        )}
      </View>
      
      <DatePicker
        modal
        open={datePickerOpen}
        date={date || new Date()}
        onConfirm={(selected) => {
          setDatePickerOpen(false);
          setDate(selected);
        }}
        onCancel={() => setDatePickerOpen(false)}
        minimumDate={new Date()}
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Cancel" 
          onPress={() => navigation.goBack()} 
          color="#E74C3C"
        />
        <Button 
          title="Save Changes" 
          onPress={handleSave} 
          disabled={!text.trim() || isSaving}
          color="#2ECC71"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C3E50',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  dateContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default EditTodoScreen;