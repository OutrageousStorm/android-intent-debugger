#!/bin/bash
# setup.sh -- Automatic Shizuku setup helper
# Enables wireless debugging and grants Shizuku permissions
# Usage: ./setup.sh

set -e
BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "\n${BOLD}🔧 Shizuku Setup Helper${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check device connected
if ! adb devices | grep -q "device$"; then
    echo -e "${YELLOW}No device connected.${NC}"
    echo "1. Enable USB debugging on device"
    echo "2. Connect with: adb connect <device-ip>"
    exit 1
fi

echo -e "\n${GREEN}✓${NC} Device connected"

# Check if Shizuku app is installed
if ! adb shell pm list packages | grep -q "moe.shizuku.privilege"; then
    echo -e "${YELLOW}⚠ Shizuku app not installed.${NC}"
    echo "Install from: https://github.com/RikkaApps/Shizuku/releases"
    exit 1
fi

echo -e "${GREEN}✓${NC} Shizuku app found"

# Enable wireless debugging (Android 11+)
echo -e "\n${BOLD}Enabling wireless debugging...${NC}"
adb shell settings put global adb_wifi_enabled 1
sleep 1

# Get device IP
IP=$(adb shell ip route | grep src | awk '{print $NF}' | head -1)
PORT=$(adb shell settings get global adb_wifi_port || echo 5555)

echo -e "${GREEN}✓${NC} Wireless debugging enabled on $IP:$PORT"

# Disconnect USB and reconnect via TCP
echo -e "\n${BOLD}Switching to wireless connection...${NC}"
adb connect "$IP:$PORT" 2>&1 | grep -q "connected" && echo -e "${GREEN}✓${NC} Connected via wireless" || echo -e "${YELLOW}⚠${NC} Connection may need manual verification"

# Grant Shizuku permissions via adb shell
echo -e "\n${BOLD}Granting permissions...${NC}"
adb shell cmd appops set moe.shizuku.privilege SYSTEM_ALERT_WINDOW allow
adb shell cmd appops set moe.shizuku.privilege BIND_ACCESSIBILITY_SERVICE allow

echo -e "${GREEN}✓${NC} Permissions granted"

# Launch Shizuku
echo -e "\n${BOLD}Launching Shizuku app...${NC}"
adb shell am start -n moe.shizuku.privilege/.ShizukuActivity

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open Shizuku on device"
echo "  2. Grant permission when prompted"
echo "  3. You're ready to use Shizuku-dependent apps"
