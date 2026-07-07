import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyArxRyFh7KTZA7a4RFQ77AEUz37Fl31mqI',
  authDomain: 'solora-stayco.firebaseapp.com',
  projectId: 'solora-stayco',
  storageBucket: 'solora-stayco.firebasestorage.app',
  messagingSenderId: '1096556175014',
  appId: '1:1096556175014:web:7120049dde13e8ac409e67',
};

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_NAME || 'Solora Admin';
const redirectUrl = process.env.VITE_EMAIL_VERIFICATION_REDIRECT || 'https://solora-stayco.vercel.app/verify-email';

if (!email || !password) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD.');
  console.error('PowerShell example:');
  console.error('$env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="StrongPassword123!"; npm run admin:create');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userCredential;
let created = false;

try {
  userCredential = await createUserWithEmailAndPassword(auth, email, password);
  created = true;
} catch (error) {
  if (error.code !== 'auth/email-already-in-use') {
    throw error;
  }
  userCredential = await signInWithEmailAndPassword(auth, email, password);
}

const user = userCredential.user;
await updateProfile(user, { displayName });

const userRef = doc(db, 'users', user.uid);
const existingDoc = await getDoc(userRef);
const existingData = existingDoc.exists() ? existingDoc.data() : {};

await setDoc(
  userRef,
  {
    ...existingData,
    uid: user.uid,
    email: user.email,
    displayName,
    role: 'admin',
    emailVerified: user.emailVerified,
    profilePhoto: existingData.profilePhoto || null,
    phoneNumber: existingData.phoneNumber || null,
    walletBalance: existingData.walletBalance || 0,
    points: existingData.points || 0,
    preferences: existingData.preferences || {
      favoriteCategories: [],
      savedListings: [],
      bookingHistory: [],
    },
    hostInfo: null,
    createdAt: existingData.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

if (!user.emailVerified) {
  await sendEmailVerification(user, {
    url: redirectUrl,
    handleCodeInApp: true,
  });
}

console.log(created ? 'Admin account created.' : 'Existing account promoted to admin.');
console.log(`Email: ${user.email}`);
console.log(`UID: ${user.uid}`);
console.log(user.emailVerified ? 'Email is already verified.' : 'Verification email sent.');
