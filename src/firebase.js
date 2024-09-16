import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app); 
const storage = getStorage(app); 
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider)
    .then((result) => {
      console.log('User signed in: ', result.user);
      return result.user;
    })
    .catch((error) => {
      console.error('Error signing in with Google: ', error);
    });
};

const logOut = () => {
  return signOut(auth)
    .then(() => {
      console.log('User signed out.');
    })
    .catch((error) => {
      console.error('Error signing out: ', error);
    });
};

export { app, analytics, auth, googleProvider, signInWithGoogle, logOut, db, storage };
