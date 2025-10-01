#!/bin/bash
echo "Generando firebase-config.js..."
cat > firebase-config.js << EOL
const firebaseConfig = {
  apiKey: __NEXT_PUBLIC_FIREBASE_API_KEY__,
    authDomain: __NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__,
      projectId: __NEXT_PUBLIC_FIREBASE_PROJECT_ID__,
        storageBucket: __NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__,
          messagingSenderId: __NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__,
            appId: __NEXT_PUBLIC_FIREBASE_APP_ID__
            };
EOL
echo "firebase-config.js generado correctamente"
