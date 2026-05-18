#!/usr/bin/env node
/**
 * cli.js -- Android Intent debugger CLI
 * Usage: node cli.js monitor [--filter action] [--app package]
 *        node cli.js send --action android.intent.action.SEND --type "text/plain"
 */
const { exec } = require('child_process');
const fs = require('fs');

function adb(cmd) {
    return new Promise((resolve, reject) => {
        exec(`adb shell ${cmd}`, (err, stdout, stderr) => {
            resolve(stdout || stderr || '');
        });
    });
}

async function monitor(filter = null, appFilter = null) {
    console.log('\n🔍 Intent Monitor\n');
    const proc = require('child_process').spawn('adb', ['logcat', '-v', 'time', 'ActivityManager:I', '*:S']);
    
    proc.stdout.on('data', (data) => {
        const line = data.toString();
        if (line.includes('Intent')) {
            const match = line.match(/Intent\s*{\s*([^}]+)\s*}/);
            if (match) {
                const intent = match[1];
                if (filter && !intent.includes(filter)) return;
                if (appFilter && !intent.includes(appFilter)) return;
                console.log(`[${new Date().toLocaleTimeString()}] ${intent}`);
            }
        }
    });
    
    process.on('SIGINT', () => {
        proc.kill();
        console.log('\nStopped.');
        process.exit(0);
    });
}

async function sendIntent(action, type = null, data = null) {
    let cmd = `am start -a ${action}`;
    if (type) cmd += ` -t ${type}`;
    if (data) cmd += ` -d ${data}`;
    const result = await adb(cmd);
    console.log(`✓ Sent: ${action}`);
    console.log(result || 'Intent fired');
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args[0] === 'monitor') {
        let filterAction = null;
        let filterApp = null;
        for (let i = 1; i < args.length; i++) {
            if (args[i] === '--filter') filterAction = args[++i];
            if (args[i] === '--app') filterApp = args[++i];
        }
        await monitor(filterAction, filterApp);
    } else if (args[0] === 'send') {
        let action = null, type = null, data = null;
        for (let i = 1; i < args.length; i++) {
            if (args[i] === '--action') action = args[++i];
            if (args[i] === '--type') type = args[++i];
            if (args[i] === '--data') data = args[++i];
        }
        if (!action) {
            console.log('Usage: node cli.js send --action <action> [--type <type>] [--data <uri>]');
            return;
        }
        await sendIntent(action, type, data);
    } else {
        console.log('Usage:\n  node cli.js monitor [--filter action] [--app package]\n  node cli.js send --action <action> [--type <type>]');
    }
}

main();
