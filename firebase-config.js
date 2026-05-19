// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUg8A4kXLfyd3uOs_DAMCL8FNmaeyxGTg",
  authDomain: "meu-dinheiro-6b1ab.firebaseapp.com",
  projectId: "meu-dinheiro-6b1ab",
  storageBucket: "meu-dinheiro-6b1ab.firebasestorage.app",
  messagingSenderId: "797217241544",
  appId: "1:797217241544:web:94a9e7f394c56b0e2b68fd",
  measurementId: "G-KYNEZ65CXE"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Cloud Firestore e exporta para usarmos no app.js
const db = getFirestore(app);

// Ativa a persistência offline do Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Múltiplas abas abertas, a persistência só pode ser ativada em uma aba de cada vez.
    console.warn("Persistência offline do Firestore falhou: Múltiplas abas abertas.");
  } else if (err.code === 'unimplemented') {
    // O navegador atual não suporta persistência.
    console.warn("Persistência offline do Firestore não suportada pelo navegador.");
  } else {
    console.error("Erro ao ativar persistência offline do Firestore:", err);
  }
});

// Inicializa o Firebase Auth e exporta para usarmos no app.js
const auth = getAuth(app);

export { db, auth };
