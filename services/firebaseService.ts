
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDATSchNyhn57g4AXqjm2I1Hnx2zY8MKi8",
  authDomain: "ateliearianeartes-aff1d.firebaseapp.com",
  projectId: "ateliearianeartes-aff1d",
  storageBucket: "ateliearianeartes-aff1d.firebasestorage.app",
  messagingSenderId: "154121051953",
  appId: "1:154121051953:web:06263b04dd8a6302051a10"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storageFB = getStorage(app);

try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') console.warn('Persistência falhou: Abas abertas');
  });
} catch (e) {}
