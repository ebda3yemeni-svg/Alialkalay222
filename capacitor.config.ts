import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.genealogy.app',
  appName: 'Genealogy App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'service-9582.ai.studio',
      '*.ai.studio',
      '*.run.app'
    ]
  }
};

export default config;
