#!/bin/bash
# Batch Test Script
# Renders regression fixtures, validates SVGs, and exports PNGs

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="${SKILL_DIR}/test-output"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}=== SVG Tech Graph - Default Visual System Regression Test ===${NC}"
echo "Test directory: $TEST_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"

# Summary counters
TOTAL=0
PASSED=0
FAILED=0

FIXTURES_DIR="${SKILL_DIR}/fixtures"
REFERENCE_FILE="${SKILL_DIR}/references/default-visual-system.md"

echo -e "${BLUE}Testing default visual system...${NC}"
echo "----------------------------------------"
if [ ! -f "$REFERENCE_FILE" ]; then
    echo -e "${RED}✗ Visual reference file not found: $REFERENCE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Visual reference file found${NC}"

if [ ! -d "$FIXTURES_DIR" ]; then
    echo -e "${YELLOW}⚠ Fixtures directory not found: $FIXTURES_DIR${NC}"
    exit 0
fi

FIXTURE_FILES=$(find "$FIXTURES_DIR" -maxdepth 1 -type f -name "*.json" | sort || true)
if [ -z "${FIXTURE_FILES:-}" ]; then
    echo -e "${YELLOW}⚠ No regression fixtures found${NC}"
    exit 0
fi

for FIXTURE in $FIXTURE_FILES; do
        BASENAME=$(basename "$FIXTURE" .json)
        SVG_FILE="${TEST_DIR}/${BASENAME}_${TIMESTAMP}.svg"
        PNG_FILE="${TEST_DIR}/${BASENAME}_${TIMESTAMP}.png"
        TEMPLATE_TYPE=$(python3 - "$FIXTURE" <<'PY'
import json
import sys
from pathlib import Path
data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
print(data.get("template_type", "architecture"))
PY
)

        echo -n "  Rendering $BASENAME... "
        TOTAL=$((TOTAL + 1))

        if python3 "${SKILL_DIR}/scripts/generate-from-template.py" "$TEMPLATE_TYPE" "$SVG_FILE" "$(cat "$FIXTURE")" > /dev/null 2>&1 \
            && "${SKILL_DIR}/scripts/validate-svg.sh" "$SVG_FILE" > /dev/null 2>&1; then
            if command -v rsvg-convert &> /dev/null \
                && rsvg-convert -w 1920 "$SVG_FILE" -o "$PNG_FILE" 2>/dev/null; then
                PNG_SIZE=$(du -h "$PNG_FILE" | cut -f1)
                echo -e "${GREEN}✓ Pass${NC} (${PNG_SIZE})"
            else
                echo -e "${GREEN}✓ Pass${NC}"
            fi
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ Fail${NC}"
            FAILED=$((FAILED + 1))
            if [ -f "$SVG_FILE" ]; then
                "${SKILL_DIR}/scripts/validate-svg.sh" "$SVG_FILE" 2>&1 | grep -E "✗|Error" | sed 's/^/    /' || true
            fi
        fi
done

# Print summary
echo ""
echo "========================================"
echo -e "${BLUE}Test Summary${NC}"
echo "----------------------------------------"
echo "Total tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
