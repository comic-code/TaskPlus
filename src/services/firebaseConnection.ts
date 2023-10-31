import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1VfH00F7EvQ8iR82M6DiyBzKmlK3TiIU",
  authDomain: "task-plus-5458f.firebaseapp.com",
  projectId: "task-plus-5458f",
  storageBucket: "task-plus-5458f.appspot.com",
  messagingSenderId: "331662144043",
  appId: "1:331662144043:web:93e866f5bbf8e58522306e"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export { db };