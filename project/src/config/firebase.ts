import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Define your Firebase configuration directly
const firebaseConfig = {
  apiKey: "AIzaSyAwvYcbw162vsBuJK3vE7Cg26xm4gay4tk",
  authDomain: "hfms-4db3c.firebaseapp.com",
  projectId: "hfms-4db3c",
  storageBucket: "hfms-4db3c.firebasestorage.app",
  messagingSenderId: "786755960251",
  appId: "1:786755960251:web:9a1c41c49584c6a577d89e",
  measurementId: "G-B36CW0NCP0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };