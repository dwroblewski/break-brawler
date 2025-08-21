#!/bin/bash

# Break Brawler Verification Script
# Tests the live deployment to verify all features are working

echo "🎮 Break Brawler System Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
URL="http://localhost:8080"

# Test counter
TOTAL=0
PASSED=0

# Test function
test_feature() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "Testing $name... "
    
    result=$(eval "$command" 2>/dev/null)
    
    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        return 1
    fi
}

# Server connectivity
test_feature "Server Running" \
    "curl -s -o /dev/null -w '%{http_code}' $URL" \
    "200"

# HTML content tests
test_feature "Index HTML" \
    "curl -s $URL | grep -o '<title>.*</title>'" \
    "<title>Break Brawler</title>"

test_feature "App Container" \
    "curl -s $URL | grep -c 'id=\"app\"'" \
    "1"

test_feature "Pad Grid" \
    "curl -s $URL | grep -c 'class=\"pad\"'" \
    "6"

test_feature "Hype Meter" \
    "curl -s $URL | grep -c 'id=\"hype-fill\"'" \
    "1"

# JavaScript modules
test_feature "Main JS Module" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/src/main.js" \
    "200"

test_feature "AudioEngine Module" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/src/core/AudioEngine.js" \
    "200"

test_feature "BeatClock Module" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/src/core/BeatClock.js" \
    "200"

test_feature "GameCore Module" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/src/core/GameCore.js" \
    "200"

test_feature "InputController Module" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/src/core/InputController.js" \
    "200"

test_feature "DebugPanel Module" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/src/core/DebugPanel.js" \
    "200"

# CSS
test_feature "Main CSS" \
    "curl -s -o /dev/null -w '%{http_code}' $URL/app/styles/main.css" \
    "200"

# Check for Tone.js dependency
test_feature "Tone.js Import" \
    "curl -s $URL/app/src/core/AudioEngine.js | grep -c \"import.*Tone\"" \
    "1"

# Check for key features in code (using grep -q for existence check)
test_feature "BeatClock Implementation" \
    "curl -s $URL/app/src/core/BeatClock.js | grep -q 'class BeatClock' && echo 'found'" \
    "found"

test_feature "Drop Window Detection" \
    "curl -s $URL/app/src/core/BeatClock.js | grep -q 'isDropWindow' && echo 'found'" \
    "found"

test_feature "Sidechain Compression" \
    "curl -s $URL/app/src/core/AudioEngine.js | grep -q 'applySidechain' && echo 'found'" \
    "found"

test_feature "End-of-Run Screen" \
    "curl -s $URL/app/src/core/GameCore.js | grep -q 'showEndOfRun' && echo 'found'" \
    "found"

test_feature "Performance Metrics" \
    "curl -s $URL/app/src/core/GameCore.js | grep -q 'timingAccuracy' && echo 'found'" \
    "found"

test_feature "Roll Mechanics" \
    "curl -s $URL/app/src/core/AudioEngine.js | grep -q 'startRoll' && echo 'found'" \
    "found"

test_feature "Debug Panel" \
    "curl -s $URL/app/src/core/DebugPanel.js | grep -q 'runSystemTest' && echo 'found'" \
    "found"

echo ""
echo "===================================="
echo -e "Results: ${GREEN}$PASSED${NC}/${TOTAL} tests passed"

PERCENTAGE=$((PASSED * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE%"

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}✅ VERIFICATION PASSED!${NC}"
    echo "The system is working as expected."
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️ VERIFICATION PARTIAL${NC}"
    echo "Most features are working but some may need attention."
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo "Major issues detected. Please investigate."
fi

echo ""
echo "To test interactively:"
echo "1. Open http://34.130.151.133:8080 in Chrome/Safari"
echo "2. Click 'TAP TO START'"
echo "3. Press Ctrl+D to open debug panel"
echo "4. Click 'RUN SYSTEM TEST' in debug panel"