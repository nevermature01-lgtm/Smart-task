import admin, { ServiceAccount } from 'firebase-admin';

// This prevents re-initialization in a serverless environment.
if (!admin.apps.length) {
  try {
    // These should be set in your environment variables.
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      // Environment variables often escape newlines, so we replace them back.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    // Check if all required service account details are present.
    // This provides a more helpful error message during development
    // if the environment variables are missing.
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase service account credentials are not set or are incomplete in environment variables. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
  } catch (error: any) {
    // Log a more descriptive error to help with debugging.
    console.error('Firebase Admin SDK Initialization Error:', error.message);
  }
}

export default admin;
