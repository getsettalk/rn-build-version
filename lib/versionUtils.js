import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

export function parseVersionName(currentVersionName) {
  // Parse versionName: numeric part (e.g., "1.0") and suffix (e.g., "-beta")
  const versionMatch = currentVersionName.match(/^(\d+\.\d+(?:\.\d+)?)(.*)$/);
  let major = 0,
    minor = 0,
    patch = 0,
    suffix = '';
  if (versionMatch) {
    const numericPart = versionMatch[1].split('.').map(Number);
    suffix = versionMatch[2] || '';
    [major, minor, patch] = numericPart.length === 2 ? [...numericPart, 0] : numericPart;
  } else {
    // Non-numeric versionName (e.g., "production")
    suffix = currentVersionName;
  }
  return { versionMatch: Boolean(versionMatch), major, minor, patch, suffix };
}

export function printVersionInfo(title, versionCode, versionName) {
  console.log(chalk.cyan(`\n=== ${title} ===`));
  console.log(chalk.blue(`Version Code: ${versionCode}`));
  console.log(chalk.blue(`Version Name: ${versionName}`));
  console.log(chalk.cyan('====================\n'));
}

export async function promptVersionUpdate({ platformLabel, currentVersionCode, currentVersionName }) {
  const { versionMatch, major, minor, patch, suffix } = parseVersionName(currentVersionName);

  printVersionInfo(`Current ${platformLabel} Version Info`, currentVersionCode, currentVersionName);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.magenta(`What do you want to do with the ${platformLabel} version?`),
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

  const changed = newVersionCode !== currentVersionCode || newVersionName !== currentVersionName;
  return { newVersionCode, newVersionName, changed };
}

export async function promptChangelogDetails() {
  const { generateChangelog } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateChangelog',
      message: chalk.magenta('Do you want to generate a changelog entry?'),
      default: true,
    },
  ]);

  let notes = '';
  if (generateChangelog) {
    const res = await inquirer.prompt([
      {
        type: 'input',
        name: 'notes',
        message: chalk.magenta('Enter changelog notes (optional, press Enter to skip):'),
      },
    ]);
    notes = res.notes.trim();
  }
  return { generateChangelog, notes };
}

export async function writeChangelog({ platformLabel, newVersionName, newVersionCode, notes = '', dryRun = false }) {
  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];
  const content = `
## [${newVersionName}] - ${date} (${platformLabel})
- **Version Name**: ${newVersionName}
- **Build Number**: ${newVersionCode}
- **Platform**: ${platformLabel}
- **Changes**:
  - Version updated from previous build.
${notes ? `  - ${notes.split('\n').join('\n  - ')}` : ''}`;

  if (dryRun) {
    console.log(chalk.yellow(`[Dry Run] Would append to CHANGELOG.md:\n${content}`));
    return;
  }

  if (!(await fs.pathExists(changelogPath))) {
    await fs.writeFile(changelogPath, '# Changelog\n');
  }
  await fs.appendFile(changelogPath, content);
  console.log(chalk.green(`Changelog updated at: ${changelogPath}`));
}
