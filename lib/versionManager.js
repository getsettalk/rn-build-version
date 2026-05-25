import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { promptVersionUpdate, promptChangelogDetails, writeChangelog, printVersionInfo } from './versionUtils.js';

class VersionManager {
  constructor({ gradlePath = 'android/app/build.gradle', dryRun = false } = {}) {
    this.gradlePath = path.resolve(process.cwd(), gradlePath);
    this.dryRun = dryRun;
  }

  async readGradleFile() {
    try {
      return await fs.readFile(this.gradlePath, 'utf8');
    } catch (err) {
      throw new Error(`Error reading ${this.gradlePath}: ${err.message}`);
    }
  }

  async writeGradleFile(content) {
    if (this.dryRun) {
      console.log(chalk.yellow('[Dry Run] Would update build.gradle with:\n'), content);
      return;
    }
    await fs.writeFile(this.gradlePath, content, 'utf8');
    console.log(chalk.green(`Updated ${this.gradlePath}`));
  }

  async backupGradleFile() {
    const backupPath = `${this.gradlePath}.bak`;
    if (this.dryRun) {
      console.log(chalk.yellow(`[Dry Run] Would create backup at: ${backupPath}`));
      return;
    }
    await fs.copy(this.gradlePath, backupPath);
    console.log(chalk.green(`Backup created at: ${backupPath}`));
  }

  async updateVersion() {
    try {
      let gradleContent = await this.readGradleFile();
      const versionCodeRegex = /versionCode\s+(\d+)/; // Matches "versionCode 1"
      // Matches any quoted string after versionName (e.g., "1.0", "1.0-beta", "production")
      const versionNameRegex = /versionName\s+["']([^"']+)["']/;
      const codeMatch = gradleContent.match(versionCodeRegex);
      const nameMatch = gradleContent.match(versionNameRegex);

      if (!codeMatch || !nameMatch) {
        console.error(chalk.red('Could not find versionCode or versionName in build.gradle.'));
        console.error(chalk.yellow('Expected format:'));
        console.error(chalk.yellow('  versionCode <number> (e.g., versionCode 1)'));
        console.error(chalk.yellow('  versionName "<any-string>" (e.g., versionName "1.0-beta")'));
        throw new Error('versionCode or versionName not found in build.gradle');
      }

      const currentVersionCode = parseInt(codeMatch[1], 10);
      const currentVersionName = nameMatch[1];

      const { newVersionCode, newVersionName, changed } = await promptVersionUpdate({
        platformLabel: 'Android',
        currentVersionCode,
        currentVersionName,
      });

      if (!changed) {
        console.log(chalk.yellow('No version changes applied.'));
        return;
      }

      const { generateChangelog, notes } = await promptChangelogDetails();

      await this.backupGradleFile();
      gradleContent = gradleContent
        .replace(versionCodeRegex, `versionCode ${newVersionCode}`)
        .replace(versionNameRegex, `versionName "${newVersionName}"`);
      await this.writeGradleFile(gradleContent);

      if (generateChangelog) {
        await writeChangelog({ platformLabel: 'Android', newVersionName, newVersionCode, notes, dryRun: this.dryRun });
      } else {
        console.log(chalk.yellow('Changelog generation skipped.'));
      }

      printVersionInfo('New Android Version Info', newVersionCode, newVersionName);
      if (notes) console.log(chalk.blue(`Changelog Notes: ${notes}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
}

export default VersionManager;
