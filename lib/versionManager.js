import fs from 'fs-extra'; // ESM import
import path from 'path'; // ESM import
import inquirer from 'inquirer'; // ESM import as per documentation

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
      console.log('[Dry Run] Would update build.gradle with:\n', content);
      return;
    }
    await fs.writeFile(this.gradlePath, content, 'utf8');
    console.log(`Updated ${this.gradlePath}`);
  }

  async backupGradleFile() {
    const backupPath = `${this.gradlePath}.bak`;
    if (this.dryRun) {
      console.log(`[Dry Run] Would create backup at: ${backupPath}`);
      return;
    }
    await fs.copy(this.gradlePath, backupPath);
    console.log(`Backup created at: ${backupPath}`);
  }

  async generateChangelog(newVersionName) {
    const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    const content = `\n## [${newVersionName}] - ${date}\n- Version updated to ${newVersionName}\n`;

    if (this.dryRun) {
      console.log(`[Dry Run] Would append to CHANGELOG.md:\n${content}`);
      return;
    }

    if (!(await fs.pathExists(changelogPath))) {
      await fs.writeFile(changelogPath, '# Changelog\n');
    }
    await fs.appendFile(changelogPath, content);
    console.log(`Changelog updated at: ${changelogPath}`);
  }

  async updateVersion() {
    try {
      let gradleContent = await this.readGradleFile();
      const versionCodeRegex = /versionCode (\d+)/;
      const versionNameRegex = /versionName "(\d+\.\d+\.\d+)"/;
      const codeMatch = gradleContent.match(versionCodeRegex);
      const nameMatch = gradleContent.match(versionNameRegex);

      if (!codeMatch || !nameMatch) {
        throw new Error('versionCode or versionName not found in build.gradle');
      }

      const currentVersionCode = parseInt(codeMatch[1], 10);
      const currentVersionName = nameMatch[1];
      const [major, minor, patch] = currentVersionName.split('.').map(Number);

      console.log(`Current versionCode: ${currentVersionCode}`);
      console.log(`Current versionName: ${currentVersionName}`);

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What do you want to do with the version?',
          choices: [
            'Increment patch (e.g., 0.0.1 -> 0.0.2)',
            'Increment minor (e.g., 0.0.1 -> 0.1.0)',
            'Increment major (e.g., 0.0.1 -> 1.0.0)',
            'Set custom version',
            'Skip (no increment)',
          ],
        },
      ]);

      let newVersionCode = currentVersionCode;
      let newVersionName = currentVersionName;

      if (action.includes('patch')) {
        newVersionCode += 1;
        newVersionName = `${major}.${minor}.${patch + 1}`;
      } else if (action.includes('minor')) {
        newVersionCode += 1;
        newVersionName = `${major}.${minor + 1}.0`;
      } else if (action.includes('major')) {
        newVersionCode += 1;
        newVersionName = `${major + 1}.0.0`;
      } else if (action.includes('custom')) {
        const { customVersionName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customVersionName',
            message: 'Enter new versionName (e.g., 1.2.3):',
            validate: (input) => /^\d+\.\d+\.\d+$/.test(input) || 'Invalid format (use x.y.z)',
          },
        ]);
        const { customVersionCode } = await inquirer.prompt([
          {
            type: 'number',
            name: 'customVersionCode',
            message: 'Enter new versionCode:',
            default: currentVersionCode + 1,
            validate: (input) => input > currentVersionCode || 'Must be greater than current',
          },
        ]);
        newVersionName = customVersionName;
        newVersionCode = customVersionCode;
      }

      if (newVersionCode !== currentVersionCode || newVersionName !== currentVersionName) {
        await this.backupGradleFile();
        gradleContent = gradleContent
          .replace(versionCodeRegex, `versionCode ${newVersionCode}`)
          .replace(versionNameRegex, `versionName "${newVersionName}"`);
        await this.writeGradleFile(gradleContent);
        await this.generateChangelog(newVersionName);
      } else {
        console.log('No version changes applied.');
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
}

export default VersionManager; // ESM export