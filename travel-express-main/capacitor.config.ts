import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.travel.express',
  appName: 'Travel Express',
  webDir: 'public',
  server: {
    url: 'https://travel-express-main.vercel.app',
    cleartext: false
  }
};

export default config;
