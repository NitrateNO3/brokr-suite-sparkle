# BrokrSuite for Android (Capacitor)

The Android app is a Capacitor shell around the same codebase and the same
backend as the website — there is no second app to maintain. The shell loads
the deployed site, so every route, screen and permission model stays identical
and any property added on either platform appears instantly on the other.

- **Package name:** `com.brokrsuite.app`
- **App name:** BrokrSuite
- **Version:** 1.0.0
- **Config:** `capacitor.config.ts`
- **Offline fallback document:** `capacitor/www/index.html`

## 1. Generate the native project (once, on your machine)

The Android SDK is required, so this step runs locally — not in Lovable.

```bash
npm install
npx cap add android
npm run cap:sync
npx cap open android      # opens Android Studio
```

`android/` is created by Capacitor and can be committed or regenerated at will.

## 2. Point the shell at your deployment

`capacitor.config.ts` reads `CAP_SERVER_URL`, defaulting to the published
Lovable URL. For a Vercel deployment:

```bash
CAP_SERVER_URL=https://your-domain.com npm run cap:sync
```

Add the host to `server.allowNavigation` in `capacitor.config.ts` too.

## 3. Permissions

Add these to `android/app/src/main/AndroidManifest.xml` inside `<manifest>`.
Capacitor adds INTERNET automatically; the rest back camera, gallery and
downloads. All of them are requested lazily, at the moment the feature is used.

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission
    android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission
    android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

`READ_MEDIA_*` covers Android 13+; the `maxSdkVersion` entries cover 10–12.
`POST_NOTIFICATIONS` is required from Android 13 for push.

To let WhatsApp / Maps / dialer / mail intents resolve on Android 11+, add:

```xml
<queries>
  <intent><action android:name="android.intent.action.VIEW" /><data android:scheme="https" /></intent>
  <intent><action android:name="android.intent.action.DIAL" /><data android:scheme="tel" /></intent>
  <intent><action android:name="android.intent.action.SENDTO" /><data android:scheme="mailto" /></intent>
  <intent><action android:name="android.intent.action.SEND" /><data android:mimeType="text/plain" /></intent>
</queries>
```

## 4. Signing and builds

Debug:

```bash
npm run android:build:debug
# android/app/build/outputs/apk/debug/app-debug.apk
```

Release — create a keystore and export the placeholders read by
`capacitor.config.ts`:

```bash
keytool -genkey -v -keystore brokrsuite.keystore -alias brokrsuite \
  -keyalg RSA -keysize 2048 -validity 10000

export ANDROID_KEYSTORE_PATH=/absolute/path/brokrsuite.keystore
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEYSTORE_ALIAS=brokrsuite
export ANDROID_KEYSTORE_ALIAS_PASSWORD=...
npm run android:build:release
```

Or wire the same values into `android/app/build.gradle`:

```gradle
android {
  signingConfigs {
    release {
      storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "brokrsuite.keystore")
      storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
      keyAlias System.getenv("ANDROID_KEYSTORE_ALIAS")
      keyPassword System.getenv("ANDROID_KEYSTORE_ALIAS_PASSWORD")
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
  defaultConfig {
    versionCode 1
    versionName "1.0.0"
    minSdkVersion 23      // Android 6+, comfortably covers Android 10–15
    targetSdkVersion 35
  }
}
```

## 5. Push notifications (Firebase Cloud Messaging)

The plugin and service layer are already wired in
`src/lib/native/notifications.ts` — only Firebase config is missing:

1. Create a Firebase project, add an Android app with id `com.brokrsuite.app`.
2. Download `google-services.json` into `android/app/`.
3. Add the Google services plugin to the Gradle files (Firebase shows the exact
   two lines during setup).
4. Send messages with a `data` payload containing
   `type` = `new_lead` | `property_inquiry` | `property_approved` | `new_property`
   and optionally `entityId`. Tapping the notification deep-links to the right
   screen automatically.

## 6. What is native-aware in the code

| Area | File |
| --- | --- |
| Platform detection, share sheet, maps/tel/mailto/WhatsApp | `src/lib/native/index.ts` |
| Camera capture + multi-select gallery | `src/lib/native/camera.ts` |
| Push notifications (FCM) | `src/lib/native/notifications.ts` |
| Brochure / PDF / document downloads | `src/lib/native/downloads.ts` |
| Connectivity | `src/lib/native/network.ts` |
| Offline drafts + auto-sync | `src/lib/offline-drafts.ts` |
| Status bar, back button, push wiring, offline banner | `src/components/native/NativeBootstrap.tsx` |
| Image compression → WebP + thumbnails | `src/lib/storage.ts` |
| Friendly error messages | `src/lib/errors.ts` |

Every helper degrades gracefully on the web build, so the website is unchanged.

## 7. iOS later

```bash
npm install @capacitor/ios
npx cap add ios
npx cap open ios
```

No application code changes are required — the same helpers already branch on
platform rather than on Android specifically.
