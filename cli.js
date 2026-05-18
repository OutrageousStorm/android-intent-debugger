#!/usr/bin/env node
/**
 * Intent Debugger — monitor and filter Android Intents in real-time
 * Usage: intent-debugger [--app package] [--action com.example] [--data scheme]
 */

const { exec } = require('child_process');
const readline = require('readline');

class IntentMonitor {
  constructor(options = {}) {
    this.appFilter = options.app || null;
    this.actionFilter = options.action || null;
    this.dataFilter = options.data || null;
    this.intents = [];
  }

  start() {
    console.log('\n📡 Android Intent Monitor');
    console.log('Filters:');
    if (this.appFilter) console.log(`  Package: ${this.appFilter}`);
    if (this.actionFilter) console.log(`  Action: ${this.actionFilter}`);
    if (this.dataFilter) console.log(`  Data scheme: ${this.dataFilter}`);
    console.log('\nPress Ctrl+C to stop\n');

    const proc = exec('adb logcat ActivityManager:I *:S', (err) => {});
    const rl = readline.createInterface({ input: proc.stdout });

    rl.on('line', (line) => this.parseAndDisplay(line));
  }

  parseAndDisplay(line) {
    // Match: Intent { act=android.intent.action.VIEW dat=https://... cmp=pkg/activity }
    const match = line.match(/Intent\s*{\s*([^}]+)\s*}/);
    if (!match) return;

    const parts = match[1];
    const action = (parts.match(/act=([^\s]+)/) || [])[1] || '';
    const data = (parts.match(/dat=([^\s]+)/) || [])[1] || '';
    const cmp = (parts.match(/cmp=([^\s]+)/) || [])[1] || '';
    const pkg = cmp.split('/')[0];

    // Apply filters
    if (this.appFilter && !pkg.includes(this.appFilter)) return;
    if (this.actionFilter && !action.includes(this.actionFilter)) return;
    if (this.dataFilter && !data.includes(this.dataFilter)) return;

    console.log(`\n📤 Intent`);
    console.log(`  Package: ${pkg}`);
    if (action) console.log(`  Action:  ${action.replace('android.intent.action.', '')}`);
    if (data) console.log(`  Data:    ${data}`);
    if (cmp) console.log(`  Target:  ${cmp}`);

    this.intents.push({ action, data, cmp, timestamp: new Date() });
  }

  summary() {
    console.log(`\n\nCaptured ${this.intents.length} intents`);
    const actions = [...new Set(this.intents.map(i => i.action))];
    console.log('Unique actions: ' + actions.slice(0, 5).join(', '));
  }
}

const args = require('minimist')(process.argv.slice(2));
const monitor = new IntentMonitor({
  app: args.app,
  action: args.action,
  data: args.data
});

process.on('SIGINT', () => {
  monitor.summary();
  process.exit(0);
});

monitor.start();
