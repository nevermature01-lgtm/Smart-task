import admin from 'firebase-admin';

// This prevents re-initialization in a serverless environment.
if (!admin.apps.length) {
  try {
    // Initialize without arguments to automatically use environment credentials
    // (like GOOGLE_APPLICATION_CREDENTIALS) in the hosting environment.
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export default admin;
