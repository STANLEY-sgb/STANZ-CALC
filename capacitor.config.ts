import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.stanzapps.calc',
  appName: 'Stanz Calc',
  webDir: 'dist',
  backgroundColor: '#CFCBC0',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#CFCBC0',
      showSpinner: false,
    },
  },
};

export default config;
