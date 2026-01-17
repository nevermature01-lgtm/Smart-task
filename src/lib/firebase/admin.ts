import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// This prevents re-initialization in a serverless environment.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The credentials are automatically sourced from the GOOGLE_APPLICATION_CREDENTIALS
      // environment variable in the hosting environment (like Cloud Run, App Engine).
      // For local development, you need to set this environment variable to point to your service account key file.
      projectId: firebaseConfig.projectId,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export default admin;
