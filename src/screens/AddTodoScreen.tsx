import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import DatePicker from 'react-native-date-picker';
import { scheduleDueDateNotification } from '../notifications'; 

type AddTodoScreenRouteProp = RouteProp<RootStackParamList, 'AddTodo'>;
type AddTodoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddTodo'>;

interface Props {
  route: AddTodoScreenRouteProp;
  navigation: AddTodoScreenNavigationProp;
}

const AddTodoScreen = ({ route, navigation }: Props) => {
  const { onSave } = route.params;
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    try {
      const newTodo = {
        todo: text,
        dueDate: date ? date.toISOString().split('T')[0] : undefined,
        completed: false,
      };

      await onSave(newTodo);

      // Schedule notification if due date exists
      if (date) {
        scheduleDueDateNotification(text, date); // <-- Add this line
      }

      navigation.goBack();
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDate = () => {
    setDate(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Todo</Text>
      
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="What needs to be done?"
        style={styles.input}
        autoFocus
      />
      
      <View style={styles.dateContainer}>
        <Button 
          title={date ? "Change Due Date" : "Set Due Date"} 
          onPress={() => setDatePickerOpen(true)} 
          color="#5D6D7E"
        />
        
        {date && (
          <>
            <Text style={styles.dateText}>
              Due: {date.toLocaleDateString()}
            </Text>
            <Button 
              title="Clear" 
              onPress={clearDate}
              color="#E74C3C"
            />
          </>
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
        
        {isSaving ? (
          <ActivityIndicator size="small" color="#2ECC71" />
        ) : (
          <Button 
            title="Save" 
            onPress={handleSave} 
            disabled={!text.trim()}
            color="#2ECC71"
          />
        )}
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

export default AddTodoScreen;