// firebase/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-odoNOJVnbCQ5M1Zq1t4F7WvTDtKHi4",
  authDomain: "stamp-timeline-app.firebaseapp.com",
  projectId: "stamp-timeline-app",
  storageBucket: "stamp-timeline-app.appspot.com",
  messagingSenderId: "44469224513",
  appId: "1:44469224513:web:296789208629082639b2c0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firebaseAuth = getAuth(app); // ✅ rename from 'auth'
export const db = getFirestore(app);

console.log("ログイン中のUID:", firebaseAuth.currentUser?.uid);