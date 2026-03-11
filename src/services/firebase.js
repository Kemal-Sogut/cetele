// Firebase configuration
// Replace these values with your actual Firebase project credentials
// Get them from: https://console.firebase.google.com -> Project Settings -> Your apps -> Web app

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: "cetele-d0087.firebaseapp.com",
    projectId: "cetele-d0087",
    storageBucket: "cetele-d0087.firebasestorage.app",
    messagingSenderId: "339770780123",
    appId: "1:339770780123:web:503ec0acfb13d6d3651ffe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
