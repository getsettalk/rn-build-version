#!/usr/bin/env node

import VersionManager from '../lib/versionManager.js'; // ESM import with .js extension
import { program } from 'commander'; // ESM import

program
  .version('1.0.0')
  .description('A tool to manage React Native version and builds')
  .option('-g, --gradle <path>', 'Path to build.gradle', 'android/app/build.gradle')
  .option('-d, --dry-run', 'Simulate changes without applying them')
  .action(async (options) => {
    const manager = new VersionManager({
      gradlePath: options.gradle,
      dryRun: options.dryRun,
    });
    await manager.updateVersion();
  });

program.parse(process.argv);