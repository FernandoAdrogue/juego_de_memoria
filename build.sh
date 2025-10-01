#!/bin/bash

# Crear el archivo de configuración de Firebase
cat <<EOF > firebase-config.js
const firebaseConfig = {
    apiKey: "$FIREBASE_API_KEY",
    authDomain: "$FIREBASE_AUTH_DOMAIN",
    projectId: "$FIREBASE_PROJECT_ID",
    storageBucket: "$FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "$FIREBASE_MESSAGING_SENDER_ID",
    appId: "$FIREBASE_APP_ID",
    measurementId: "$FIREBASE_MEASUREMENT_ID"
};
EOF

# Crear un archivo de salida estático (necesario para Vercel)
mkdir -p public
cp index.html public/
cp styles.css public/
cp scripts.js public/
