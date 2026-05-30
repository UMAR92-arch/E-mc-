import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyANbKb3Mrf1WEjtfHaAwG-gmpwbCj9ecRw",
  authDomain: "e-mc-1a234.firebaseapp.com",
  projectId: "e-mc-1a234",
  storageBucket: "e-mc-1a234.firebasestorage.app",
  messagingSenderId: "85575428194",
  appId: "1:85575428194:web:257d053b5899d4f629493b",
  measurementId: "G-5KLSG214GR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
