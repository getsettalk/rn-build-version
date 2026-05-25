<img width="1020" height="661" alt="image" src="https://github.com/user-attachments/assets/9d9d6a4c-e3a0-4be0-ad9a-20262941cc97" />

# rn-build-version

A React Native tool for managing version numbers on **Android** (`versionCode` / `versionName` in `build.gradle`) and **iOS** (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in `project.pbxproj`, or `CFBundleShortVersionString` / `CFBundleVersion` in `Info.plist`). It simplifies version management by providing interactive prompts and automates backups and changelog updates.

## Features
- **Version Management**:
  - Increment patch (e.g., `0.0.1` -> `0.0.2`), minor (e.g., `0.0.1` -> `0.1.0`), or major (e.g., `0.0.1` -> `1.0.0`) versions.
  - Set custom `versionCode` and `versionName`.
  - Skip version updates for local testing builds.
- **Automation**:
  - Backup the version file before modifications.
  - Generate or update a `CHANGELOG.md` file with version details.
- **Flexibility**:
  - Choose the platform to update: `android`, `ios`, or `both`.
  - Custom file path support via CLI options.
  - Dry-run mode to simulate changes without applying them.

## Prerequisites
- Ensure your `build.gradle` contains `versionCode` and `versionName` (e.g., in `defaultConfig`).
- For iOS, ensure either `project.pbxproj` defines `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`, or `Info.plist` defines `CFBundleShortVersionString` / `CFBundleVersion`.
- Configure signing for release builds.

### Notes
- The tool assumes a standard React Native project structure.
- Run `chmod +x android/gradlew` on macOS/Linux if Gradle permissions are an issue.

## Installation

Install the package globally or as a development dependency in your React Native project:

```bash
# Globally
npm install -g rn-build-version

# As a dev dependency
npm install --save-dev rn-build-version

# Using yarn
yarn add --dev rn-build-version
```

## Usage

### 1. Add Scripts to Your `package.json`

Integrate the tool into your React Native project by adding these scripts. The `--platform` flag decides **which version gets bumped** (`android`, `ios`, or `both`).

> **The iOS scripts contain placeholders you MUST rename** before they will work — see [What you MUST rename for iOS](#what-you-must-rename-for-ios) right below.

```jsonc
{
  "scripts": {
    // ───────── ANDROID (built with Gradle) ─────────
    "build:android:apk": "rn-build-version --platform android && cd android && ./gradlew clean assembleRelease",
    "build:android:aab": "rn-build-version --platform android && cd android && ./gradlew clean bundleRelease",
    "build:android:apk:fast": "rn-build-version --platform android && cd android && ./gradlew assembleRelease",
    "build:android:aab:fast": "rn-build-version --platform android && cd android && ./gradlew bundleRelease",
    "build:android:apk:local": "cd android && ./gradlew clean assembleRelease",
    "build:android:aab:local": "cd android && ./gradlew clean bundleRelease",

    // ───────── iOS (built with Xcode / xcodebuild) ─────────
    // RENAME "YourApp" in BOTH the -workspace and -scheme values (see table below)
    "build:ios": "rn-build-version --platform ios && cd ios && xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphoneos archive -archivePath build/YourApp.xcarchive",
    "build:ios:local": "cd ios && xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphoneos build",

    // ───────── VERSION BUMP ONLY (no build) ─────────
    "version:android": "rn-build-version --platform android",
    "version:ios": "rn-build-version --platform ios",
    "version:both": "rn-build-version --platform both"
  }
}
```

> Note: `jsonc` (JSON with comments) is shown for clarity. **Remove the `// ...` comment lines** before pasting into a real `package.json` — standard `package.json` does not allow comments.

---

### What you MUST rename for iOS

The Android scripts work **as-is**. The **iOS scripts will NOT run until you replace `YourApp`** with your app's real Xcode names. There are **two values to change**, and they are often **different from each other**:

| Placeholder in the script | Replace with | Where to find it |
|---|---|---|
| **`YourApp.xcworkspace`** | Your `.xcworkspace` file name | Look inside the `ios/` folder — it is the file ending in **`.xcworkspace`** (e.g. `MyCoolApp.xcworkspace`). |
| **`-scheme YourApp`** | Your **scheme** name | Open Xcode -> top toolbar scheme dropdown, **or** run `xcodebuild -list -workspace ios/YourApp.xcworkspace`. |
| **`build/YourApp.xcarchive`** | Any output path you like | Just keep it consistent; rename `YourApp` to match for tidiness. |

#### Example — before vs. after

Say your app is called **`MyCoolApp`** (so `ios/MyCoolApp.xcworkspace` exists). You would change:

```jsonc
// BEFORE (placeholder — will fail)
"build:ios": "rn-build-version --platform ios && cd ios && xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphoneos archive -archivePath build/YourApp.xcarchive"
```

```jsonc
// AFTER (renamed to MyCoolApp — works)
"build:ios": "rn-build-version --platform ios && cd ios && xcodebuild -workspace MyCoolApp.xcworkspace -scheme MyCoolApp -configuration Release -sdk iphoneos archive -archivePath build/MyCoolApp.xcarchive"
```

> Quick way to find both names at once — run this from your project root:
> ```bash
> ls ios/*.xcworkspace        # shows the workspace name
> xcodebuild -list -workspace ios/*.xcworkspace   # shows scheme names
> ```

#### iOS prerequisites

- Run **`cd ios && pod install`** once before building.
- A real `.ipa` for the App Store also needs **code signing** + an `xcodebuild -exportArchive` step. For full release automation, most teams use **[fastlane](https://fastlane.tools/)** instead of raw `xcodebuild` — `rn-build-version --platform ios` still does the version bump; fastlane handles the build/upload.

---

### 2. Run the Commands

#### Production Builds (bump version, then build)
```bash
# Android
yarn build:android:apk
yarn build:android:aab

# iOS  (after renaming YourApp!)
yarn build:ios
```
These prompt you to update the version **before** building.

#### Bump version only (no build)
```bash
yarn version:android    # bump Android only
yarn version:ios        # bump iOS only
yarn version:both       # bump BOTH in sync
```

#### Local Builds (No Version Change)
```bash
yarn build:android:apk:local
yarn build:android:aab:local
yarn build:ios:local
```
These skip version prompts and build with the current version.

## When to Use Each Command

| Command | Platform | Use Case |
|---------|----------|---------|
| `yarn build:android:apk` | Android | Full build with version bump + clean (production APK). |
| `yarn build:android:aab` | Android | Full build with version bump + clean (production AAB / Play Store). |
| `yarn build:android:apk:fast` | Android | Build with version bump, no clean (faster iteration). |
| `yarn build:android:aab:fast` | Android | Build with version bump, no clean (faster iteration). |
| `yarn build:android:apk:local` | Android | Build with clean, **no** version bump. |
| `yarn build:android:aab:local` | Android | Build with clean, **no** version bump. |
| `yarn build:ios` | iOS | Bump iOS version, then archive via Xcode (**rename `YourApp` first**). |
| `yarn build:ios:local` | iOS | Build current iOS version, no bump (**rename `YourApp` first**). |
| `yarn version:android` | Android | Bump Android version only, no build. |
| `yarn version:ios` | iOS | Bump iOS version only, no build. |
| `yarn version:both` | Both | Bump Android **and** iOS together (keep store versions in sync). |

## CLI Usage

Run the tool directly with options:
```bash
rn-build-version [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --platform <platform>` | Which platform to update: `android`, `ios`, or `both` | `android` |
| `-g, --gradle <path>` | Path to your Android `build.gradle` file | `android/app/build.gradle` |
| `-i, --ios <path>` | Path to your `ios` directory, `project.pbxproj`, or `Info.plist` | `ios` |
| `-d, --dry-run` | Simulate changes without applying them | `false` |

### iOS support

iOS versions can live in two places depending on your React Native version. The tool **auto-detects** which applies:

- **Modern RN (around 0.71+)** — `ios/<App>.xcodeproj/project.pbxproj` (`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`). All build configs are updated.
- **Legacy RN** — `ios/<App>/Info.plist` (`CFBundleShortVersionString` and `CFBundleVersion`).

```bash
# Update iOS only
rn-build-version --platform ios

# Update Android and iOS in one run
rn-build-version --platform both

# Point at a specific file
rn-build-version --platform ios --ios ios/MyApp.xcodeproj/project.pbxproj
```

> Default platform is `android`, so existing setups keep working unchanged.

### Examples

- Use a custom Gradle path:
```bash
rn-build-version --gradle ./custom/path/build.gradle
```

- Simulate changes (dry-run):
```bash
rn-build-version --dry-run
```

- Combine options:
```bash
rn-build-version --gradle ./android/app/build.gradle --dry-run
```

## Example Interaction

When you run `rn-build-version` or a build script with it, you will see:

```
=== Current Android Version Info ===
Version Code: 1
Version Name: 0.0.1
====================

? What do you want to do with the Android version? (Use arrow keys)
  > Increment patch (e.g., 1.0.1-beta -> 1.0.2-beta)
    Increment minor (e.g., 1.0.1-beta -> 1.1.0-beta)
    Increment major (e.g., 1.0.1-beta -> 2.0.0-beta)
    Set custom version
    Skip (no increment)
```

- Choosing **"Increment patch"**:
    - Updates `versionCode: 2`, `versionName: "0.0.2"`.
    - Creates a backup (`build.gradle.bak` on Android, `project.pbxproj.bak` / `Info.plist.bak` on iOS).
    - Appends to `CHANGELOG.md`.

- Choosing **"Set custom version"**:
    - Prompts for new `versionName` and `versionCode`.
    - Example: Set `versionName: "1.2.3"`, `versionCode: 123`.

---

### Screenshots


<p align="center">

  <img src="https://github.com/user-attachments/assets/09587298-f6a0-457f-b9cd-522cf5577ff2" width="45%" />
  <img src="https://github.com/user-attachments/assets/e2b31f89-f11f-423f-819f-6aeb670210ae" width="45%" />
</p>


---
Fixed: Now this will work all type of version naming convention.
