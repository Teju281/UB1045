import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.projectId}-default-rtdb.firebaseio.com`
  });
}

export const db = admin.firestore();
export const auth = admin.auth();

// Collections
export const collections = {
  users: 'users',
  hospitals: 'hospitals',
  doctors: 'doctors',
  patients: 'patients',
  medicalRecords: 'medical_records',
  appointments: 'appointments',
  emergencySOS: 'emergency_sos',
  staffTasks: 'staff_tasks',
  auditLogs: 'audit_logs',
  refreshTokens: 'refresh_tokens',
  beds: 'beds'
};

console.log('✅ Firebase initialized successfully');
