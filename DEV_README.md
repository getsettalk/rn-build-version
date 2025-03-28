# Problem sometimes run in macbook

when you try to run command to build apk or aab for android in mackbook
that will shown error like this :

```
env: node\r: No such file or directory
error Command failed with exit code 127.
```

## Why This Happens

env: node\r Issue:
The `\r` (carriage return) suggests a line-ending problem, typically caused by a script written on Windows (using CRLF `\r\n`) being executed on macOS (which expects LF \n). This is breaking the shebang (`#!/usr/bin/env node`) in your `rn-build-version` script or a related executable, making macOS unable to find the `node` interpreter.
Exit code `127` means "command not found," reinforcing that the shell couldn’t locate `node` due to the malformed shebang.

## Steps to Fix and Update

1. Fix `bin/index.js` Line Endings
- Open `bin/index.js` in an editor (e.g., VS Code).
Ensure it uses LF line endings:
- In VS Code: Bottom-right corner, click "CRLF" and switch to "LF".
Or

```
sed -i '' 's/\r$//' bin/index.js
```

### here is full code like this :
navigate at your project folder
and use that command , that will nothing return error 

to verify than fine :

```
 cat -e bin/index.js
 ```


 > You will get return back:

 ```
 rajeshkumar@Rajeshs-MacBook-Pro rn-build-version % cat -e bin/index.js
#!/usr/bin/env node$
$
import VersionManager from '../lib/versionManager.js';$
import { program } from 'commander';$
$
program$
  .version('1.0.0')$
  .description('A tool to manage React Native version and builds')$
  .option('-g, --gradle <path>', 'Path to build.gradle', 'android/app/build.gradle')$
  .option('-d, --dry-run', 'Simulate changes without applying them')$
  .action(async (options) => {$
    const manager = new VersionManager({$
      gradlePath: options.gradle,$
      dryRun: options.dryRun,$
    });$
    await manager.updateVersion();$
  });$
$
program.parse(process.argv);%                                                                                          
rajeshkumar@Rajeshs-MacBook-Pro rn-build-version % cat -e bin/index.js
```

you can see here $ sign  at the bignning
```
#!/usr/bin/env node$
```

it mean that work on window and macbook also.