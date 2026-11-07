// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortexai-7221d.firebaseapp.com",
  projectId: "cortexai-7221d",
  storageBucket: "cortexai-7221d.firebasestorage.app",
  messagingSenderId: "307480662568",
  appId: "1:307480662568:web:4d72a6d2799546a9ccdb1d",
  measurementId: "G-2EM5H6SMH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
googleProvider.addScope("profile");
googleProvider.addScope("email");