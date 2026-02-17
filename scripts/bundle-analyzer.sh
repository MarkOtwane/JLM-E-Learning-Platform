#!/bin/bash

################################################################################
# Bundle Analyzer Script
#
# Analyzes the production bundle size and generates a detailed report.
# Run after building the production bundle.
#
# Usage:
#   bash scripts/bundle-analyzer.sh
#   npm run analyze:bundle
#
# Requirements:
#   - webpack-bundle-analyzer npm package installed
#   - Production bundle already built (dist/Frontend/browser/)
#
# Output:
#   - bundle-report.html (interactive visualization)
#   - Bundle size analysis in console
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="Frontend"
DIST_PATH="${FRONTEND_DIR}/dist/Frontend/browser"
REPORT_FILE="${FRONTEND_DIR}/bundle-report.html"
SIZE_LIMIT_BYTES=512000 # 500KB

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Bundle Analyzer${NC}"
echo -e "${BLUE}================================${NC}"

# Check if production build exists
if [ ! -d "$DIST_PATH" ]; then
  echo -e "${RED}[ERROR] Production build not found at: $DIST_PATH${NC}"
  echo -e "${YELLOW}Run: cd $FRONTEND_DIR && npm run build:prod${NC}"
  exit 1
fi

# Find main bundle file
MAIN_BUNDLE=$(find "$DIST_PATH" -name "main*.js" -type f | head -1)

if [ -z "$MAIN_BUNDLE" ]; then
  echo -e "${RED}[ERROR] Main bundle not found in $DIST_PATH${NC}"
  exit 1
fi

# Calculate bundle size
BUNDLE_SIZE=$(stat -c%s "$MAIN_BUNDLE" 2>/dev/null || stat -f%z "$MAIN_BUNDLE" 2>/dev/null)
BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))
BUNDLE_SIZE_MB=$(echo "scale=2; $BUNDLE_SIZE_KB / 1024" | bc)

echo -e "\n${BLUE}Initial Bundle Analysis:${NC}"
echo -e "  File: $(basename $MAIN_BUNDLE)"
echo -e "  Size: ${YELLOW}${BUNDLE_SIZE_KB} KB${NC} (${BUNDLE_SIZE_MB} MB)"

# Check against size limit
if [ "$BUNDLE_SIZE" -gt "$SIZE_LIMIT_BYTES" ]; then
  echo -e "  Status: ${RED}EXCEEDS LIMIT${NC}"
  LIMIT_KB=$((SIZE_LIMIT_BYTES / 1024))
  OVER_BY=$((BUNDLE_SIZE - SIZE_LIMIT_BYTES))
  OVER_BY_KB=$((OVER_BY / 1024))
  echo -e "  Limit: ${RED}${LIMIT_KB} KB${NC}"
  echo -e "  Over by: ${RED}+${OVER_BY_KB} KB${NC}"
else
  echo -e "  Status: ${GREEN}OK${NC}"
  UNDER_BY=$((SIZE_LIMIT_BYTES - BUNDLE_SIZE))
  UNDER_BY_KB=$((UNDER_BY / 1024))
  echo -e "  Budget remaining: ${GREEN}${UNDER_BY_KB} KB${NC}"
fi

# List all chunks
echo -e "\n${BLUE}All Chunks:${NC}"
find "$DIST_PATH" -name "*.js" -type f | sort | while read file; do
  SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
  SIZE_KB=$((SIZE / 1024))
  FILENAME=$(basename "$file")
  echo -e "  ${FILENAME}: ${SIZE_KB} KB"
done

# Generate webpack-bundle-analyzer report
if command -v npx &> /dev/null; then
  echo -e "\n${BLUE}Generating detailed analysis report...${NC}"
  
  # Check if webpack-bundle-analyzer is installed
  if npm list webpack-bundle-analyzer &>/dev/null; then
    npx webpack-bundle-analyzer "$MAIN_BUNDLE" -m static -r "$REPORT_FILE" -s coded 2>/dev/null || true
    
    if [ -f "$REPORT_FILE" ]; then
      echo -e "${GREEN}Report generated: ${REPORT_FILE}${NC}"
      echo -e "${YELLOW}Open in browser: file://$(pwd)/${REPORT_FILE}${NC}"
    fi
  else
    echo -e "${YELLOW}Tip: Install webpack-bundle-analyzer for detailed analysis${NC}"
    echo -e "${YELLOW}npm install --save-dev webpack-bundle-analyzer${NC}"
  fi
fi

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}================================${NC}"

if [ "$BUNDLE_SIZE" -gt "$SIZE_LIMIT_BYTES" ]; then
  echo -e "${RED}Action Required: Bundle exceeds 500KB limit${NC}"
  echo -e "\nOptimization suggestions:"
  echo -e "  1. Check for unused Font Awesome icons"
  echo -e "  2. Verify ApexCharts and jsPDF are lazy-loaded"
  echo -e "  3. Run: ng build --prod --stats-json"
  echo -e "  4. Analyze with webpack-bundle-analyzer"
else
  echo -e "${GREEN}Bundle size is within limits!${NC}"
fi

echo ""
