import admin from 'firebase-admin';

// This prevents re-initialization in a serverless environment and ensures a single instance.
if (!admin.apps.length) {
  try {
    // In a managed environment like Firebase App Hosting or Google Cloud,
    // calling initializeApp() without arguments allows the SDK to automatically
    // discover credentials from the environment. This is the most robust method.
    admin.initializeApp();
  } catch (error: any) {
    // Log a more descriptive error to help with debugging if initialization fails.
    console.error('Firebase Admin SDK Initialization Error:', error.message);
  }
}

export default admin;
