import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prairie2cloud.treelisty',
  appName: 'TreeListy',
  webDir: 'www',

  // Server config for development
  // Uncomment to load from dev server instead of built files
  // server: {
  //   url: 'http://localhost:8080',
  //   cleartext: true
  // },

  ios: {
    // Match TreeListy's dark theme
    backgroundColor: '#1a1a2e',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // Allow inline media playback (for voice recordings)
    allowsLinkPreview: true,
    scrollEnabled: true
  },

  android: {
    backgroundColor: '#1a1a2e',
    allowMixedContent: true
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },

    Keyboard: {
      // Resize content when keyboard shows
      resize: 'body',
      // iOS keyboard style
      style: 'dark',
      // Don't scroll to input automatically (we handle this)
      resizeOnFullScreen: true
    },

    StatusBar: {
      // Match app theme
      style: 'dark',
      backgroundColor: '#1a1a2e'
    },

    Haptics: {
      // Enable haptic feedback
    }
  }
};

export default config;
