import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyByFIt2OdLOZqkAKnAw3672TTTgZrMof7E",
  authDomain: "warikko-57309.firebaseapp.com",
  projectId: "warikko-57309",
  storageBucket: "warikko-57309.firebasestorage.app",
  messagingSenderId: "732284054403",
  appId: "1:732284054403:android:36ffffe453aa02132fa4b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
