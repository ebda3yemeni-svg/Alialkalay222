import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mayar.app',
  appName: 'موقع أنساب بني علي الكلعي',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    cleartext: true,
    allowNavigation: [
      'service-9582.ai.studio',
      '*.ai.studio',
      '*.run.app',
      'credible-descent-q98sv.firebaseapp.com',
      '*.firebaseapp.com',
      'credible-descent-q98sv.web.app',
      '*.web.app',
      'accounts.google.com',
      '*.google.com'
    ]
  }
};

export default config;
