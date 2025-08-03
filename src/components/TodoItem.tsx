import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Todo } from '../types/todos';

interface Props {
  todo: Todo;
  onToggleCompletion: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const TodoItem = ({ todo, onToggleCompletion, onDelete, onEdit }: Props) => {
  return (
    <View style={[styles.container, todo.completed && styles.completedContainer]}>
      <TouchableOpacity onPress={onToggleCompletion} style={styles.checkboxContainer}>
        <Icon 
          name={todo.completed ? 'check-box' : 'check-box-outline-blank'} 
          size={24} 
          color={todo.completed ? '#4CAF50' : '#757575'} 
        />
      </TouchableOpacity>
      
      <View style={styles.textContainer}>
        <Text 
          style={[styles.title, todo.completed && styles.completedTitle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {todo.todo}
        </Text>
        {todo.dueDate && (
          <Text style={styles.dueDate}>
            {new Date(todo.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Icon name="edit" size={20} color="#2196F3" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Icon name="delete" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedContainer: {
    backgroundColor: '#f5f5f5',
  },
  checkboxContainer: {
    padding: 4,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 16,
    color: '#212121',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#757575',
  },
  dueDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default TodoItem;