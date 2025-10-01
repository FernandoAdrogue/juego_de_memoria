#!/bin/bash
echo "Generando firebase-config.js..."
cat > firebase-config.js << EOL
const firebaseConfig = {
  apiKey: "${FIREBASE_API_KEY}",
    authDomain: "${FIREBASE_AUTH_DOMAIN}",
      projectId: "${FIREBASE_PROJECT_ID}",
        storageBucket: "${FIREBASE_STORAGE_BUCKET}",
          messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
            appId: "${FIREBASE_APP_ID}"
            };

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    var firebaseInitialized = true;
    console.log("Firebase inicializado correctamente.");
} catch (e) {
    console.error("Error al inicializar Firebase: ", e);
    var firebaseInitialized = false;
    document.addEventListener('DOMContentLoaded', (event) => {
        const setupInstructions = document.getElementById('setupInstructions');
        if (setupInstructions) {
            setupInstructions.style.display = 'block';
        }
    });
}
EOL
echo "firebase-config.js generado correctamente."
