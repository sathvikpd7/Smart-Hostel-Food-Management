import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDg5liYGM-aCnLRACqb_o2Dgvx4teZZcOQ",
  authDomain: "mealmaster-8h1tn.firebaseapp.com",
  projectId: "mealmaster-8h1tn",
  storageBucket: "mealmaster-8h1tn.firebasestorage.app",
  messagingSenderId: "351491532744",
  appId: "1:351491532744:web:0bf3d9ebf316df203802fd"
} as const;

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
