import { initializeApp, getApps } from 'firebase/app'
import { getAuth, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * The app runs in one of two modes. If a Firebase project is configured we talk to a real
 * Firebase backend; otherwise we fall back to the seeded demo repository so the UI is
 * fully explorable with zero configuration. Nothing outside src/data/ needs to know.
 */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId)

const app = isFirebaseConfigured ? (getApps()[0] ?? initializeApp(config)) : null

export const auth = isFirebaseConfigured ? getAuth(app) : null
export const db = isFirebaseConfigured ? getFirestore(app) : null

/**
 * "Remember me" maps directly onto session persistence: remembered sessions survive a
 * browser restart (local), unremembered ones die with the tab (session).
 */
const REMEMBER_KEY = 'tg.remember'

export const setRememberMe = (value) => {
  window.localStorage.setItem(REMEMBER_KEY, value ? '1' : '0')
}

export const getRememberMe = () => window.localStorage.getItem(REMEMBER_KEY) !== '0'

export const rememberPersistence = () =>
  getRememberMe() ? browserLocalPersistence : browserSessionPersistence
