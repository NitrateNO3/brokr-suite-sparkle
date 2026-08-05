import type { CapacitorConfig } from "@capacitor/cli";

/**
 * BrokrSuite Android shell.
 *
 * The app is a TanStack Start SSR application, so the native shell loads the
 * deployed site (`server.url`) instead of a bundled static build. The Capacitor
 * bridge is still injected into that origin, so every native plugin (camera,
 * share, push, filesystem, network) works exactly as it would in a bundled app.
 *
 * `webDir` points at a tiny offline fallback document that is shown only when
 * the remote origin cannot be reached at all.
 */
const SERVER_URL = process.env["CAP_SERVER_URL"] ?? "https://brokr-suite-sparkle.lovable.app";

const config: CapacitorConfig = {
  appId: "com.brokrsuite.app",
  appName: "BrokrSuite",
  webDir: "capacitor/www",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env["NODE_ENV"] !== "production",
    buildOptions: {
      // Fill these in (or export the matching env vars) before a release build.
      keystorePath: process.env["ANDROID_KEYSTORE_PATH"] ?? "",
      keystorePassword: process.env["ANDROID_KEYSTORE_PASSWORD"] ?? "",
      keystoreAlias: process.env["ANDROID_KEYSTORE_ALIAS"] ?? "",
      keystoreAliasPassword: process.env["ANDROID_KEYSTORE_ALIAS_PASSWORD"] ?? "",
      releaseType: "APK",
    },
  },
  server: {
    url: SERVER_URL,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "brokr-suite-sparkle.lovable.app",
      "*.lovable.app",
      "pwbineucevtxeakbplye.supabase.co",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0B1220",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
