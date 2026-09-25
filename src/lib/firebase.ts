import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot,
  deleteDoc,
  getDocs
} from 'firebase/firestore';

import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Allow environment variable overrides (e.g. for Vercel deployment or personal Firebase projects)
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId || '(default)'
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Function to save anonymous community rent report to Firebase Firestore
export async function saveAnonymousReportToFirebase(reportData: any) {
  const path = 'reports';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...reportData,
      createdAt: reportData.createdAt || new Date().toISOString().split('T')[0],
      isFirebaseStored: true
    });
    return { id: docRef.id, ...reportData };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch (err) {
      console.warn('Falling back to local state storage for submitted report:', err);
    }
    return { id: `local-${Date.now()}`, ...reportData, isFirebaseStored: false };
  }
}

// Function to subscribe to community reports from Firestore
export function subscribeToFirebaseReports(
  callback: (reports: any[]) => void,
  onError?: (err: any) => void
) {
  const path = 'reports';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const reportsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(reportsList);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (err) {
        if (onError) {
          onError(err);
        } else {
          console.warn('Firestore subscription permission notice:', err);
        }
      }
    }
  );
}

// Function to save property listing to Firebase Firestore
export async function saveListingToFirebase(listingData: any) {
  const path = 'listings';
  const id = listingData.id || `lst-custom-${Date.now()}`;
  const dataToSave = {
    ...listingData,
    id,
    postedDate: listingData.postedDate || new Date().toISOString().split('T')[0],
    isFirebaseStored: true,
  };

  try {
    const listingRef = doc(db, path, id);
    await setDoc(listingRef, dataToSave, { merge: true });
    return dataToSave;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch (err) {
      console.warn('Firestore listing write note (saved locally):', err);
    }
    return { ...dataToSave, isFirebaseStored: false };
  }
}

// Function to update existing property listing in Firebase Firestore
export async function updateListingInFirebase(id: string, updatedData: any) {
  const path = 'listings';
  try {
    const listingRef = doc(db, path, id);
    await setDoc(listingRef, { ...updatedData, id }, { merge: true });
    return { ...updatedData, id, isFirebaseStored: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch (err) {
      console.warn('Firestore listing update note:', err);
    }
    return { ...updatedData, id, isFirebaseStored: false };
  }
}

// Function to delete property listing in Firebase Firestore
export async function deleteListingFromFirebase(id: string) {
  const path = 'listings';
  try {
    const listingRef = doc(db, path, id);
    await deleteDoc(listingRef);
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch (err) {
      console.warn('Firestore listing delete note:', err);
    }
    return false;
  }
}

// Function to subscribe to real-time listings from Firestore
export function subscribeToListingsFromFirebase(
  callback: (listings: any[]) => void,
  onError?: (err: any) => void
) {
  const path = 'listings';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const listingsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(listingsList);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (err) {
        if (onError) {
          onError(err);
        } else {
          console.warn('Firestore listings subscription notice:', err);
        }
      }
    }
  );
}

// Function to fetch all listings once from Firestore
export async function fetchListingsFromFirebase() {
  const path = 'listings';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Firestore fetchListings error:', error);
    return [];
  }
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
}

// Helper function to sync user details to Firestore document
export async function syncUserProfile(user: FirebaseUser, extraData?: { phone?: string; name?: string }) {
  if (!user) return null;

  const profileData: UserProfile = {
    uid: user.uid,
    name: extraData?.name || user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    phone: extraData?.phone || '',
    photoURL: user.photoURL || undefined
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (!extraData?.phone && data?.phone) {
        profileData.phone = data.phone;
      }
    }
    await setDoc(userRef, profileData, { merge: true });
  } catch (err) {
    console.warn('Firestore profile sync note (profile saved in memory):', err);
  }

  return profileData;
}

// Sign Up with Email and Password
export async function signUpWithEmail(email: string, pass: string, name: string, phone: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  const profile = await syncUserProfile(cred.user, { name, phone });
  return profile;
}

// Sign In with Email and Password
export async function signInWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const profile = await syncUserProfile(cred.user);
  return profile;
}

// Sign In with Google
export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const profile = await syncUserProfile(cred.user);
  return profile;
}

// Sign Out
export async function logoutUser() {
  await signOut(auth);
}

// Auth State Change Listener
export function subscribeToAuth(callback: (profile: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await syncUserProfile(firebaseUser);
      callback(profile);
    } else {
      callback(null);
    }
  });
}
