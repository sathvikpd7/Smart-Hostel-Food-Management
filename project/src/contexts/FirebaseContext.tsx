import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface FirebaseContextType {
  addTodo: (todo: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  updateTodo: (id: string, todo: string) => Promise<void>;
  todos: Todo[];
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const auth = getAuth();

  const fetchTodos = async () => {
    try {
      const todosRef = collection(db, 'todos');
      const querySnapshot = await getDocs(todosRef);
      const todosData = querySnapshot.docs
        .filter(doc => doc.data()?.userId === auth.currentUser?.uid)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      setTodos(todosData as Todo[]);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchTodos();
      } else {
        setTodos([]);
      }
    });

    if (auth.currentUser) {
      await fetchTodos();
    }

    return () => unsubscribe();
  }, [auth]);

  const addTodo = async (todo: string) => {
    try {
      const todosRef = collection(db, 'todos');
      await addDoc(todosRef, {
        text: todo,
        completed: false,
        userId: auth.currentUser?.uid
      });
      await fetchTodos();
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const todoRef = doc(db, 'todos', id);
      const todoDoc = await getDoc(todoRef);
      const todoData = todoDoc.data();
      
      if (todoData?.userId === auth.currentUser?.uid) {
        await deleteDoc(todoRef);
        await fetchTodos();
      } else {
        throw new Error('Unauthorized: You can only delete your own todos');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  };

  const updateTodo = async (id: string, todo: string) => {
    try {
      const todoRef = doc(db, 'todos', id);
      const todoDoc = await getDoc(todoRef);
      const todoData = todoDoc.data();
      
      if (todoData?.userId === auth.currentUser?.uid) {
        await updateDoc(todoRef, {
          text: todo
        });
        await fetchTodos();
      } else {
        throw new Error('Unauthorized: You can only update your own todos');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  };

  const value = {
    todos,
    addTodo,
    deleteTodo,
    updateTodo
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
