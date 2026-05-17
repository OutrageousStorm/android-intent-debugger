#!/usr/bin/env node
/**
 * android-intent-debugger — Monitor and filter Android Intents
 * Usage: node index.js [--filter com.example] [--action ACTION]
 */
const { spawn } = require('child_process');

const filterPkg = process.argv.find(a => a.startsWith('--filter='))?.split('=')[1] || '';
const filterAction = process.argv.find(a => a.startsWith('--action='))?.split('=')[1] || '';

console.log('🎯 Android Intent Debugger (Ctrl+C to stop)\n');
if (filterPkg) console.log(`Filter: package="${filterPkg}"`);
if (filterAction) console.log(`Filter: action="${filterAction}"\n`);

const logcat = spawn('adb', ['logcat', '-v', 'time', '*:D']);

let buffer = '';
logcat.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line
    
    for (const line of lines) {
        if (line.includes('sendBroadcast') || line.includes('startService') || line.includes('startActivity')) {
            const pkgMatch = line.match(/pkg[=:]([a-z][a-zA-Z0-9_.]+)/i);
            const actionMatch = line.match(/action[=:]([a-zA-Z0-9_.]+)/i);
            
            const pkg = pkgMatch ? pkgMatch[1] : '?';
            const action = actionMatch ? actionMatch[1] : '(implicit)';
            
            if ((filterPkg && !pkg.includes(filterPkg)) || 
                (filterAction && !action.includes(filterAction))) {
                continue;
            }
            
            const time = line.match(/^\d+-\d+ \d+:\d+:\d+/)?.[0] || '';
            console.log(`[${time}] ${pkg.split('.').pop()} → ${action}`);
        }
    }
});

logcat.on('close', (code) => {
    console.log('\\nStopped.');
    process.exit(code);
});

process.on('SIGINT', () => {
    logcat.kill();
});
