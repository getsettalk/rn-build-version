# 🌟 **rn-build-version**

A React Native tool for managing `versionCode` and `versionName` in your Android `build.gradle` file, with support for building APKs and AABs. It simplifies version management by providing interactive prompts and automates backups and changelog updates.

---

## 🚀 **Features**

### 🔹 Version Management
✅ Increment **patch** (`0.0.1` → `0.0.2`), **minor** (`0.0.1` → `0.1.0`), or **major** (`0.0.1` → `1.0.0`) versions.  
✅ Set custom `versionCode` and `versionName`.  
✅ Skip version updates for local testing builds.  

### 🔹 Automation
✅ Backup `build.gradle` before modifications.  
✅ Generate or update a `CHANGELOG.md` file with version details.  

### 🔹 Flexibility
✅ Custom Gradle file path support via CLI option.  
✅ Dry-run mode to simulate changes without applying them.  

---

## 📌 **Prerequisites**
✔ Ensure your `build.gradle` contains `versionCode` and `versionName` (e.g., in `defaultConfig`).  
✔ Configure signing in `build.gradle` for release builds.  
✔ If running on macOS/Linux, grant execution permission for Gradle:  
```bash
chmod +x android/gradlew
```

---

## 📥 **Installation**
Install the package globally or as a development dependency in your React Native project:

```bash
# 🌍 Globally
npm install -g rn-build-version

# 📦 As a dev dependency
npm install --save-dev rn-build-version

# 🧶 Using Yarn
yarn add --dev rn-build-version
```

---

## 🎯 **Usage**

### 1️⃣ **Add Scripts to `package.json`**
Modify your `package.json` to include:

```json
{
  "scripts": {
    "build:android:apk": "rn-build-version && cd android && ./gradlew clean assembleRelease",
    "build:android:aab": "rn-build-version && cd android && ./gradlew clean bundleRelease",
    "build:android:apk:local": "cd android && ./gradlew clean assembleRelease",
    "build:android:aab:local": "cd android && ./gradlew clean bundleRelease"
  }
}
```

### 2️⃣ **Run the Commands**

#### 🔵 **Production Builds (with Version Management):**
```bash
npm run build:android:apk
npm run build:android:aab
```
👉 These commands prompt you to update the version before building.

#### 🟢 **Local Testing Builds (No Version Change):**
```bash
npm run build:android:apk:local
npm run build:android:aab:local
```
👉 These commands skip version prompts and build with the current version.

---

## 🖥 **CLI Usage**
Run the tool directly with options:
```bash
rn-build-version [options]
```

### 📌 Available Options:
| Option | Description | Default |
|--------|-------------|---------|
| `-g, --gradle <path>` | Path to your `build.gradle` file | `android/app/build.gradle` |
| `-d, --dry-run` | Simulate changes without applying them | `false` |

### 🔹 Examples:

📌 **Use a custom Gradle path:**
```bash
rn-build-version --gradle ./custom/path/build.gradle
```

📌 **Simulate changes (dry-run mode):**
```bash
rn-build-version --dry-run
```

📌 **Combine multiple options:**
```bash
rn-build-version --gradle ./android/app/build.gradle --dry-run
```

---

## 🎭 **Example Interaction**
When running `rn-build-version` or a build script, you’ll see an interactive prompt:

```bash
Current versionCode: 1
Current versionName: 0.0.1
? What do you want to do with the version? (Use arrow keys)
  > Increment patch (e.g., 0.0.1 -> 0.0.2)
    Increment minor (e.g., 0.0.1 -> 0.1.0)
    Increment major (e.g., 0.0.1 -> 1.0.0)
    Set custom version
    Skip (no increment)
```

👉 **Choosing "Increment patch"**:
- Updates `versionCode: 2`, `versionName: "0.0.2"`.
- Creates a backup (`build.gradle.bak`).
- Appends to `CHANGELOG.md`.

👉 **Choosing "Set custom version"**:
- Prompts for new `versionName` and `versionCode`.
- Example: Set `versionName: "1.2.3"`, `versionCode: 123`.

---

💡 **Enjoy hassle-free versioning in your React Native projects! 🚀**
