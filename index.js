#!/usr/bin/env node
/**
 * index.js -- Android Intent debugger via ADB logcat
 * Usage: node index.js --app com.example.app
 *        node index.js --action android.intent.action.BOOT_COMPLETED
 */
const { spawn } = require('child_process');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));

const adb = spawn('adb', ['logcat', '-v', 'time', '*:D']);
const intentPattern = /Intent.*?(action|scheme|package|data|category)/i;

console.log('\n📡 Android Intent Monitor\n');
if (args.app) console.log(`App filter: ${args.app}`);
if (args.action) console.log(`Action filter: ${args.action}`);
console.log('');

const intents = [];
let lastIntents = {};

adb.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  
  for (const line of lines) {
    if (!intentPattern.test(line)) continue;
    
    const actionMatch = line.match(/action=([^\s,]+)/);
    const pkgMatch = line.match(/package=([^\s,]+)/) || line.match(/cmp=([^/]+)\//);
    const dataMatch = line.match(/data=([^\s,]+)/);
    
    const intent = {
      action: actionMatch ? actionMatch[1] : 'unknown',
      package: pkgMatch ? pkgMatch[1] : 'unknown',
      data: dataMatch ? dataMatch[1] : '',
      time: new Date().toLocaleTimeString(),
    };

    // Apply filters
    if (args.app && !intent.package.includes(args.app)) continue;
    if (args.action && !intent.action.includes(args.action)) continue;
    if (args.filter && !JSON.stringify(intent).includes(args.filter)) continue;

    const key = `${intent.action}|${intent.package}`;
    lastIntents[key] = (lastIntents[key] || 0) + 1;

    // Show
    const count = lastIntents[key];
    const badge = count > 1 ? ` (x${count})` : '';
    console.log(`[${intent.time}] ${intent.action.split('.').pop()} ← ${intent.package.split('.').pop()}${badge}`);
    if (intent.data) console.log(`           data: ${intent.data}\n`);

    intents.push(intent);
  }
});

adb.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

if (args.save) {
  process.on('exit', () => {
    fs.writeFileSync(args.save, JSON.stringify(intents, null, 2));
    console.log(`\nSaved ${intents.length} intents to ${args.save}`);
  });
}

process.on('SIGINT', () => {
  console.log('\nStopped.');
  process.exit();
});
