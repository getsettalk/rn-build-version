import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { promptVersionUpdate, promptChangelogDetails, writeChangelog, printVersionInfo } from './versionUtils.js';

class IosVersionManager {
  constructor({ iosPath = 'ios', dryRun = false } = {}) {
    this.iosPath = path.resolve(process.cwd(), iosPath);
    this.dryRun = dryRun;
    this.targetFile = null;
    this.mode = null; // 'pbxproj' | 'plist'
  }

  // Locate the file that owns the iOS version. Modern RN (>=0.71) stores it in
  // project.pbxproj as MARKETING_VERSION/CURRENT_PROJECT_VERSION; older projects
  // hardcode it in Info.plist. We prefer pbxproj because modern Info.plist files
  // only contain $(MARKETING_VERSION) placeholders.
  async detectTarget() {
    const stat = await fs.stat(this.iosPath).catch(() => null);
    if (!stat) throw new Error(`iOS path not found: ${this.iosPath}`);

    if (stat.isFile()) {
      if (this.iosPath.endsWith('.pbxproj')) {
        this.targetFile = this.iosPath;
        this.mode = 'pbxproj';
        return;
      }
      if (this.iosPath.endsWith('.plist')) {
        this.targetFile = this.iosPath;
        this.mode = 'plist';
        return;
      }
      throw new Error(`Unsupported iOS file (expected .pbxproj or .plist): ${this.iosPath}`);
    }

    const entries = await fs.readdir(this.iosPath);
    const xcodeproj = entries.find((e) => e.endsWith('.xcodeproj'));
    if (xcodeproj) {
      const pbxproj = path.join(this.iosPath, xcodeproj, 'project.pbxproj');
      if (await fs.pathExists(pbxproj)) {
        const content = await fs.readFile(pbxproj, 'utf8');
        if (/MARKETING_VERSION\s*=/.test(content)) {
          this.targetFile = pbxproj;
          this.mode = 'pbxproj';
          return;
        }
      }
    }

    const plist = await this.findInfoPlist();
    if (plist) {
      this.targetFile = plist;
      this.mode = 'plist';
      return;
    }

    throw new Error(
      `Could not find MARKETING_VERSION in project.pbxproj or CFBundleShortVersionString in Info.plist under ${this.iosPath}`
    );
  }

  async findInfoPlist() {
    const entries = await fs.readdir(this.iosPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const candidate = path.join(this.iosPath, entry.name, 'Info.plist');
        if (await fs.pathExists(candidate)) {
          const content = await fs.readFile(candidate, 'utf8');
          if (content.includes('CFBundleShortVersionString')) return candidate;
        }
      }
    }
    const top = path.join(this.iosPath, 'Info.plist');
    if (await fs.pathExists(top)) return top;
    return null;
  }

  parseCurrent(content) {
    if (this.mode === 'pbxproj') {
      const nameMatch = content.match(/MARKETING_VERSION\s*=\s*([^;]+);/);
      const codeMatch = content.match(/CURRENT_PROJECT_VERSION\s*=\s*([^;]+);/);
      if (!nameMatch || !codeMatch) {
        throw new Error('Could not find MARKETING_VERSION or CURRENT_PROJECT_VERSION in project.pbxproj.');
      }
      const name = nameMatch[1].trim().replace(/"/g, '');
      const code = parseInt(codeMatch[1].trim().replace(/"/g, ''), 10);
      return { name, code: Number.isNaN(code) ? 0 : code };
    }

    const nameMatch = content.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]*)<\/string>/);
    const codeMatch = content.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]*)<\/string>/);
    if (!nameMatch || !codeMatch) {
      throw new Error('Could not find CFBundleShortVersionString or CFBundleVersion in Info.plist.');
    }
    const name = nameMatch[1].trim();
    if (name.startsWith('$(')) {
      throw new Error('Info.plist uses build-setting placeholders (e.g. $(MARKETING_VERSION)); versions are managed in project.pbxproj.');
    }
    const code = parseInt(codeMatch[1].trim(), 10);
    return { name, code: Number.isNaN(code) ? 0 : code };
  }

  applyChanges(content, newVersionName, newVersionCode) {
    if (this.mode === 'pbxproj') {
      // Build settings appear once per build config (Debug/Release) — replace all.
      return content
        .replace(/MARKETING_VERSION\s*=\s*[^;]+;/g, `MARKETING_VERSION = ${newVersionName};`)
        .replace(/CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g, `CURRENT_PROJECT_VERSION = ${newVersionCode};`);
    }
    return content
      .replace(/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${newVersionName}$2`)
      .replace(/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${newVersionCode}$2`);
  }

  async backup() {
    const backupPath = `${this.targetFile}.bak`;
    if (this.dryRun) {
      console.log(chalk.yellow(`[Dry Run] Would create backup at: ${backupPath}`));
      return;
    }
    await fs.copy(this.targetFile, backupPath);
    console.log(chalk.green(`Backup created at: ${backupPath}`));
  }

  async write(content) {
    if (this.dryRun) {
      console.log(chalk.yellow(`[Dry Run] Would update ${this.targetFile} with the new version values.`));
      return;
    }
    await fs.writeFile(this.targetFile, content, 'utf8');
    console.log(chalk.green(`Updated ${this.targetFile}`));
  }

  async updateVersion() {
    try {
      await this.detectTarget();
      console.log(chalk.gray(`Detected iOS version source: ${this.targetFile} (${this.mode})`));

      let content = await fs.readFile(this.targetFile, 'utf8');
      const { name: currentVersionName, code: currentVersionCode } = this.parseCurrent(content);

      const { newVersionCode, newVersionName, changed } = await promptVersionUpdate({
        platformLabel: 'iOS',
        currentVersionCode,
        currentVersionName,
      });

      if (!changed) {
        console.log(chalk.yellow('No version changes applied.'));
        return;
      }

      const { generateChangelog, notes } = await promptChangelogDetails();

      await this.backup();
      content = this.applyChanges(content, newVersionName, newVersionCode);
      await this.write(content);

      if (generateChangelog) {
        await writeChangelog({ platformLabel: 'iOS', newVersionName, newVersionCode, notes, dryRun: this.dryRun });
      } else {
        console.log(chalk.yellow('Changelog generation skipped.'));
      }

      printVersionInfo('New iOS Version Info', newVersionCode, newVersionName);
      if (notes) console.log(chalk.blue(`Changelog Notes: ${notes}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
}

export default IosVersionManager;
