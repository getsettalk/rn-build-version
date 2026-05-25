#!/usr/bin/env node

import { readFileSync } from 'fs';
import VersionManager from '../lib/versionManager.js';
import IosVersionManager from '../lib/iosVersionManager.js';
import { program } from 'commander';
import chalk from 'chalk';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

program
  .version(pkg.version)
  .description('A tool to manage React Native version and builds (Android & iOS)')
  .option('-g, --gradle <path>', 'Path to Android build.gradle', 'android/app/build.gradle')
  .option('-i, --ios <path>', 'Path to ios directory, project.pbxproj, or Info.plist', 'ios')
  .option('-p, --platform <platform>', 'Which platform to update: android | ios | both', 'android')
  .option('-d, --dry-run', 'Simulate changes without applying them')
  .action(async (options) => {
    const platform = String(options.platform).toLowerCase();

    if (!['android', 'ios', 'both'].includes(platform)) {
      console.error(chalk.red(`Invalid --platform "${options.platform}". Use: android, ios, or both.`));
      process.exit(1);
    }

    if (platform === 'android' || platform === 'both') {
      const manager = new VersionManager({ gradlePath: options.gradle, dryRun: options.dryRun });
      await manager.updateVersion();
    }

    if (platform === 'ios' || platform === 'both') {
      const iosManager = new IosVersionManager({ iosPath: options.ios, dryRun: options.dryRun });
      await iosManager.updateVersion();
    }
  });

program.parse(process.argv);
