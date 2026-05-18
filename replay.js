#!/usr/bin/env node
/**
 * replay.js -- Record and replay Android Intent sequences
 * Capture real intents from logcat, then replay them for testing
 * Usage: node replay.js --record > intents.json
 *        node replay.js --replay intents.json
 */
const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

function adb(cmd) {
  try {
    return execSync(`adb shell ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (e) {
    return '';
  }
}

function recordIntents(duration = 30) {
  console.log(`📹 Recording intents for ${duration} seconds...\n`);
  const start = Date.now();
  const intents = [];

  const proc = require('child_process').spawn('adb', ['logcat', '-v', 'brief', 'ActivityManager:D', '*:S']);

  return new Promise((resolve) => {
    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        // Match intent lines: "Starting intent ..." or "Broadcast intent"
        if (line.includes('intent {') || line.includes('action=')) {
          const match = line.match(/action=([^ ]+)/);
          const pkgMatch = line.match(/cmp=([^ }]+)/);
          if (match) {
            intents.push({
              action: match[1],
              component: pkgMatch ? pkgMatch[1] : null,
              timestamp: new Date().toISOString(),
            });
            console.log(`  ✓ Captured: ${match[1]}`);
          }
        }
      }
      if (Date.now() - start > duration * 1000) {
        proc.kill();
        resolve(intents);
      }
    });
  });
}

function replayIntents(filename) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  console.log(`▶️  Replaying ${data.length} intents...\n`);

  for (let i = 0; i < data.length; i++) {
    const intent = data[i];
    const cmd = intent.component
      ? `am start -n ${intent.component}`
      : `am start -a ${intent.action}`;
    
    console.log(`[${i+1}/${data.length}] ${intent.action} (${intent.component || 'implicit'})`);
    adb(cmd);
  }
  console.log('\n✅ Done');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--record')) {
    const intents = await recordIntents(args.includes('--duration') ? parseInt(args[args.indexOf('--duration') + 1]) : 30);
    console.log(JSON.stringify(intents, null, 2));
  } else if (args.includes('--replay')) {
    const idx = args.indexOf('--replay');
    const file = args[idx + 1] || 'intents.json';
    replayIntents(file);
  } else {
    console.log('Usage:');
    console.log('  node replay.js --record [--duration 30]      Record intents');
    console.log('  node replay.js --replay intents.json          Replay intents');
  }
}

main();
