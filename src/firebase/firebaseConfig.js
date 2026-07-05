// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration (same as Firebase Console / CDN snippet).
// storageBucket is part of the project config; listing photos default to base64 in Firestore.
// Storage is used only when hosts upload via Storage (e.g. profile photos, optional listing uploads).
const firebaseConfig = {
  apiKey: "AIzaSyArxRyFh7KTZA7a4RFQ77AEUz37Fl31mqI",
  authDomain: "solora-stayco.firebaseapp.com",
  projectId: "solora-stayco",
  storageBucket: "solora-stayco.firebasestorage.app",
  messagingSenderId: "1096556175014",
  appId: "1:1096556175014:web:7120049dde13e8ac409e67",
  measurementId: "G-6HWWBGEJ84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services: Auth (login/roles), Firestore (listings, users, moods), Storage (optional uploads),
// Analytics, Functions (e.g. PayPal payouts when deployed).
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, analytics, auth, db, storage, functions };

