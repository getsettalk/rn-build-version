#!/usr/bin/env node

const VersionManager = require('../lib/versionManager'); // Import the VersionManager class
const { program } = require('commander'); // CLI parsing library

// Define CLI version and options
program
  .version('1.0.0') // Package version
  .description('A tool to manage React Native version and builds')
  .option('-g, --gradle <path>', 'Path to build.gradle', 'android/app/build.gradle') // Custom Gradle path
  .option('-d, --dry-run', 'Simulate changes without applying them') // Dry-run flag
  .action(async (options) => {
    // Instantiate VersionManager with CLI options
    const manager = new VersionManager({
      gradlePath: options.gradle,
      dryRun: options.dryRun,
    });
    await manager.updateVersion(); // Run the version update process
  });

// Parse command-line arguments and execute
program.parse(process.argv);