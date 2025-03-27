import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

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

  async generateChangelog(newVersionName, newVersionCode, notes = '') {
    const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    const content = `
## [${newVersionName}] - ${date}
- **Version Name**: ${newVersionName}
- **Build Number (versionCode)**: ${newVersionCode}
- **Changes**:
  - Version updated from previous build.
${notes ? `  - ${notes.split('\n').join('\n  - ')}` : ''}`;

    if (this.dryRun) {
      console.log(chalk.yellow(`[Dry Run] Would append to CHANGELOG.md:\n${content}`));
      return;
    }

    if (!(await fs.pathExists(changelogPath))) {
      await fs.writeFile(changelogPath, '# Changelog\n');
    }
    await fs.appendFile(changelogPath, content);
    console.log(chalk.green(`Changelog updated at: ${changelogPath}`));
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

      // Parse versionName: separate numeric part (e.g., "1.0") and suffix (e.g., "-beta")
      const versionMatch = currentVersionName.match(/^(\d+\.\d+(?:\.\d+)?)(.*)$/);
      let major, minor, patch = 0, suffix = '';
      if (versionMatch) {
        const numericPart = versionMatch[1].split('.').map(Number);
        suffix = versionMatch[2] || ''; // e.g., "-beta", "-rc1", or empty
        [major, minor, patch] = numericPart.length === 2 ? [...numericPart, 0] : numericPart;
      } else {
        // Non-numeric versionName (e.g., "production")
        major = 0;
        minor = 0;
        patch = 0;
        suffix = currentVersionName;
      }

      console.log(chalk.cyan('\n=== Current Version Info ==='));
      console.log(chalk.blue(`Version Code: ${currentVersionCode}`));
      console.log(chalk.blue(`Version Name: ${currentVersionName}`));
      console.log(chalk.cyan('====================\n'));

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: chalk.magenta('What do you want to do with the version?'),
          choices: [
            'Increment patch (e.g., 1.0.1-beta -> 1.0.2-beta)',
            'Increment minor (e.g., 1.0.1-beta -> 1.1.0-beta)',
            'Increment major (e.g., 1.0.1-beta -> 2.0.0-beta)',
            'Set custom version',
            'Skip (no increment)',
          ],
        },
      ]);

      let newVersionCode = currentVersionCode;
      let newVersionName = currentVersionName;

      if (action.includes('patch')) {
        newVersionCode += 1;
        newVersionName = versionMatch ? `${major}.${minor}.${patch + 1}${suffix}` : `${currentVersionName}-patch${newVersionCode}`;
      } else if (action.includes('minor')) {
        newVersionCode += 1;
        newVersionName = versionMatch ? `${major}.${minor + 1}.0${suffix}` : `${currentVersionName}-minor${newVersionCode}`;
      } else if (action.includes('major')) {
        newVersionCode += 1;
        newVersionName = versionMatch ? `${major + 1}.0.0${suffix}` : `${currentVersionName}-major${newVersionCode}`;
      } else if (action.includes('custom')) {
        const { customVersionName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customVersionName',
            message: chalk.magenta('Enter new versionName (e.g., 1.2-beta or production):'),
            default: currentVersionName,
          },
        ]);
        const { customVersionCode } = await inquirer.prompt([
          {
            type: 'number',
            name: 'customVersionCode',
            message: chalk.magenta('Enter new versionCode:'),
            default: currentVersionCode + 1,
            validate: (input) => input > currentVersionCode || 'Must be greater than current',
          },
        ]);
        newVersionName = customVersionName;
        newVersionCode = customVersionCode;
      }

      if (newVersionCode !== currentVersionCode || newVersionName !== currentVersionName) {
        const { generateChangelog } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'generateChangelog',
            message: chalk.magenta('Do you want to generate a changelog entry?'),
            default: true,
          },
        ]);

        let changelogNotes = '';
        if (generateChangelog) {
          const { notes } = await inquirer.prompt([
            {
              type: 'input',
              name: 'notes',
              message: chalk.magenta('Enter changelog notes (optional, press Enter to skip):'),
            },
          ]);
          changelogNotes = notes.trim();
        }

        await this.backupGradleFile();
        gradleContent = gradleContent
          .replace(versionCodeRegex, `versionCode ${newVersionCode}`)
          .replace(versionNameRegex, `versionName "${newVersionName}"`);
        await this.writeGradleFile(gradleContent);

        if (generateChangelog) {
          await this.generateChangelog(newVersionName, newVersionCode, changelogNotes);
        } else {
          console.log(chalk.yellow('Changelog generation skipped.'));
        }

        console.log(chalk.cyan('\n=== New Version Info ==='));
        console.log(chalk.blue(`Version Code: ${newVersionCode}`));
        console.log(chalk.blue(`Version Name: ${newVersionName}`));
        if (changelogNotes) console.log(chalk.blue(`Changelog Notes: ${changelogNotes}`));
        console.log(chalk.cyan('====================\n'));
      } else {
        console.log(chalk.yellow('No version changes applied.'));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
}

export default VersionManager;