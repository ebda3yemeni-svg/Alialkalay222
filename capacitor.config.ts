import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mayar.app',
  appName: 'Genealogy App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'service-9582.ai.studio',
    cleartext: true,
    allowNavigation: [
      'service-9582.ai.studio',
      '*.ai.studio',
      '*.run.app',
      'credible-descent-q98sv.firebaseapp.com',
      '*.firebaseapp.com',
      'accounts.google.com',
      '*.google.com'
    ]
  }
};

export default config;
