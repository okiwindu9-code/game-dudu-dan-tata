import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface AuthErrorDetail {
  code: string;
  message: string;
  unauthorizedDomain?: string;
  consoleUrl?: string;
}

export function parseAuthError(err: unknown): AuthErrorDetail {
  const rawCode =
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  const rawMsg = err instanceof Error ? err.message : String(err);

  if (
    rawCode === 'auth/unauthorized-domain' ||
    rawMsg.includes('auth/unauthorized-domain')
  ) {
    const hostname =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'domain-saat-ini';
    return {
      code: 'auth/unauthorized-domain',
      message: `Domain "${hostname}" belum terdaftar di Authorized Domains Firebase Authentication.`,
      unauthorizedDomain: hostname,
      consoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`,
    };
  }

  if (rawCode === 'auth/popup-blocked' || rawMsg.includes('auth/popup-blocked')) {
    return {
      code: 'auth/popup-blocked',
      message:
        'Popup login diblokir oleh browser. Izinkan pop-up untuk halaman ini di pengaturan browser Android lalu coba lagi.',
    };
  }

  if (
    rawCode === 'auth/popup-closed-by-user' ||
    rawCode === 'auth/cancelled-popup-request'
  ) {
    return {
      code: rawCode,
      message: 'Login Google dibatalkan sebelum selesai.',
    };
  }

  if (rawCode === 'auth/network-request-failed') {
    return {
      code: rawCode,
      message: 'Koneksi internet bermasalah saat mencoba masuk dengan Google.',
    };
  }

  return {
    code: rawCode || 'auth/unknown',
    message: rawMsg || 'Login Google gagal. Silakan coba lagi.',
  };
}

export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutFirebase() {
  return signOut(auth);
}
