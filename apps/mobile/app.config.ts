import type { ExpoConfig } from 'expo/config';

// Set these per EAS build profile (eas.json "env") or in a local .env file.
const APP_ENV = process.env.APP_ENV ?? 'development';
const AI_PROXY_URL = process.env.AI_PROXY_URL ?? 'http://localhost:8787';

const config: ExpoConfig = {
  name: 'Stay Clean',
  slug: 'stay-clean',
  owner: 'manandp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'stayclean',
  userInterfaceStyle: 'automatic',
  // 'web' is only the browser demo (pnpm demo:web); the real app is iOS and Android.
  platforms: ['ios', 'android', 'web'],
  web: { output: 'single', bundler: 'metro' },
  ios: {
    // TODO(release): replace with your own bundle identifier.
    bundleIdentifier: 'com.example.stayclean',
    icon: './assets/expo.icon',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    // TODO(release): replace with your own package name.
    package: 'com.example.stayclean',
    // Journal data must never leave the device through Android backups.
    allowBackup: false,
    // Not needed: nothing is read from or written to shared storage.
    blockedPermissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    adaptiveIcon: {
      backgroundColor: '#0F1B29',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    // One web bundle, so the browser demo can ship as a single page.
    ['expo-router', { asyncRoutes: { web: false } }],
    ['expo-splash-screen', { backgroundColor: '#0F1B29', image: './assets/images/splash-icon.png', imageWidth: 76 }],
    ['expo-sqlite', { useSQLCipher: true }],
    'expo-secure-store',
    'expo-localization',
    ['expo-local-authentication', { faceIDPermission: 'Stay Clean uses Face ID to keep your journal private.' }],
    ['expo-notifications', { color: '#3A7F72' }],
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Stay Clean uses the microphone so you can speak your journal entries.',
        speechRecognitionPermission: 'Stay Clean turns your voice into text on your phone so you can journal by speaking.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appEnv: APP_ENV,
    aiProxyUrl: AI_PROXY_URL,
    // Links this project to its EAS project for cloud builds.
    eas: { projectId: '4f24c7a8-fa8f-462c-9cad-f77f42421f39' },
  },
};

export default config;
