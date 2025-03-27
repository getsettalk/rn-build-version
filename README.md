# rn-build-version

A React Native tool for managing `versionCode` and `versionName` in your Android `build.gradle` file, with support for building APKs and AABs. It simplifies version management by providing interactive prompts and automates backups and changelog updates.

## Features
- **Version Management**:
  - Increment patch (e.g., `0.0.1` → `0.0.2`), minor (e.g., `0.0.1` → `0.1.0`), or major (e.g., `0.0.1` → `1.0.0`) versions.
  - Set custom `versionCode` and `versionName`.
  - Skip version updates for local testing builds.
- **Automation**:
  - Backup `build.gradle` before modifications.
  - Generate or update a `CHANGELOG.md` file with version details.
- **Flexibility**:
  - Custom Gradle file path support via CLI option.
  - Dry-run mode to simulate changes without applying them.



## Prerequisites
- Ensure your build.gradle contains versionCode and versionName (e.g., in defaultConfig).
- Configure signing in build.gradle for release builds.

### Notes
- The tool assumes a standard React Native Android project structure.
- Run chmod +x android/gradlew on macOS/Linux if Gradle permissions are an issue.


## Installation

Install the package globally or as a development dependency in your React Native project:

```bash
# Globally
npm install -g rn-build-version

# As a dev dependency
npm install --save-dev rn-build-version

## using yarn
yarn add --dev rn-build-version
```

# Uses

### 1. Add Scripts to Your `package.json`
Integrate the tool into your React Native project by adding these scripts:

```
{
  "scripts": {
    "build:android:apk": "rn-build-version && cd android && ./gradlew clean assembleRelease",
    "build:android:aab": "rn-build-version && cd android && ./gradlew clean bundleRelease",
    "build:android:apk:local": "cd android && ./gradlew clean assembleRelease",
    "build:android:aab:local": "cd android && ./gradlew clean bundleRelease"
  }
}
```

### 2. Run the Commands
- Production Builds (with Version Management):

```
npm run build:android:apk
npm run build:android:aab
```
These commands prompt you to update the version before building.

- Local Testing Builds (No Version Change):

```
npm run build:android:apk:local
npm run build:android:aab:local
```

These skip version prompts and build with the current version.

### 3. CLI Usage

Run the tool directly with options:
```
rn-build-version [options]
```

Option	Description	Default
-g, --gradle <path>	Path to your build.gradle file	android/app/build.gradle
-d, --dry-run	Simulate changes without applying them	false


##### Examples

- Use a custom Gradle path:
```
rn-build-version --gradle ./custom/path/build.gradle
```

- Simulate changes (dry-run):

```
rn-build-version --dry-run
```

- Combine options:

```
rn-build-version --gradle ./android/app/build.gradle --dry-run
```

##### Example Interaction

When you run `rn-build-version` or a build script with it, you’ll see:

```
Current versionCode: 1
Current versionName: 0.0.1
? What do you want to do with the version? (Use arrow keys)
  > Increment patch (e.g., 0.0.1 -> 0.0.2)
    Increment minor (e.g., 0.0.1 -> 0.1.0)
    Increment major (e.g., 0.0.1 -> 1.0.0)
    Set custom version
    Skip (no increment)
```

- Choosing "Increment patch":
    - Updates to versionCode: 2, versionName: "0.0.2".
    - Creates a backup (build.gradle.bak).
    - Appends to CHANGELOG.md.


- Choosing "Set custom
    - Prompts for new versionName and versionCode.
    - Example: Set versionName: "1.2.3", versionCode: 123.

