import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';

// Use web.app for authDomain so auth handler (__/auth/handler) is loaded from real live Firebase server
// instead of being intercepted by Capacitor local web server (which hosts credible-descent-q98sv.firebaseapp.com).
const firebaseConfig = {
  ...rawFirebaseConfig,
  authDomain: 'credible-descent-q98sv.web.app',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

