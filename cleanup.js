// cleanup.js - Script para limpiar reportes
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function limpiarEvaluaciones() {
  try {
    console.log('🧹 Iniciando limpieza de evaluaciones...');
    
    const querySnapshot = await getDocs(collection(db, 'evaluaciones'));
    let contador = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'evaluaciones', docSnapshot.id));
      contador++;
      console.log(`✅ Eliminado: ${docSnapshot.id}`);
    }
    
    console.log(`🎉 Limpieza completada. ${contador} evaluaciones eliminadas.`);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar la función
limpiarEvaluaciones();