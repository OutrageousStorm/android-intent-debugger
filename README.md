# 📡 Android Intent Debugger

Monitor all Intents sent/received on Android device in real-time.

## Usage

```bash
npm install
node index.js --app com.example.app
node index.js --action android.intent.action.BOOT_COMPLETED
node index.js --filter "scheme:content"
```

## Features

- 🔴 Live Intent stream via logcat
- 🎯 Filter by package, action, or data scheme
- 📊 Count occurrences, show frequencies
- 💾 Save to JSON for analysis
