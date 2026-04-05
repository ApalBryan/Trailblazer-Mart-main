import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBfXPqmyQ494Meg_c3Zwtg-jCvCdjHbMOM",
  authDomain: "mobile-phone-store-e8e50.firebaseapp.com",
  projectId: "mobile-phone-store-e8e50",
  storageBucket: "mobile-phone-store-e8e50.firebasestorage.app",
  messagingSenderId: "264631256095",
  appId: "1:264631256095:web:54dd9628b253faebc5812a",
  measurementId: "G-VDVE89Q41Y"
};

const app = initializeApp(firebaseConfig);

// keep your services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);