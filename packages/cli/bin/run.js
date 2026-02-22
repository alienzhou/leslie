#!/usr/bin/env node
import('../dist/src/index.js').then(({ runCli }) => {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
});
