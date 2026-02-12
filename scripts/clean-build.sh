#!/bin/bash

################################################################################
# Clean Build Script for LMS
#
# Purpose: Remove all build artifacts, caches, and temporary files to ensure
#          a clean build environment. This prevents issues with stale files
#          and mismatched build artifacts.
#
# Usage: ./scripts/clean-build.sh
#
# What it removes:
# - .next directory (Next.js build output)
# - node_modules/.cache (package caches)
# - All PM2 logs
# - Prisma engine cache
# - Next.js cache
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   LMS Clean Build Script${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}[1/6]${NC} Cleaning Next.js build directory (.next)..."
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✓${NC} Removed .next directory"
else
    echo -e "${GREEN}✓${NC} .next directory doesn't exist (already clean)"
fi

echo ""
echo -e "${YELLOW}[2/6]${NC} Cleaning node_modules cache..."
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo -e "${GREEN}✓${NC} Removed node_modules/.cache"
else
    echo -e "${GREEN}✓${NC} node_modules cache doesn't exist (already clean)"
fi

echo ""
echo -e "${YELLOW}[3/6]${NC} Cleaning Prisma engine cache..."
PRISMA_CACHE_DIRS=(
    "$HOME/.cache/prisma"
    "$HOME/.npm/_npx"
    "node_modules/.prisma"
)

for dir in "${PRISMA_CACHE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo -e "${GREEN}✓${NC} Removed $dir"
    fi
done
echo -e "${GREEN}✓${NC} Prisma caches cleaned"

echo ""
echo -e "${YELLOW}[4/6]${NC} Cleaning PM2 logs..."
if [ -d "logs" ]; then
    # Keep the directory but clean the log files
    rm -f logs/pm2-*.log
    echo -e "${GREEN}✓${NC} Cleaned PM2 logs"
else
    echo -e "${GREEN}✓${NC} No PM2 logs to clean"
fi

echo ""
echo -e "${YELLOW}[5/6]${NC} Cleaning Next.js standalone cache..."
if [ -d ".next/cache" ]; then
    rm -rf .next/cache
    echo -e "${GREEN}✓${NC} Removed Next.js cache"
fi

echo ""
echo -e "${YELLOW}[6/6]${NC} Cleaning temporary files..."
# Remove any temporary build files
find . -name "*.log" -type f -not -path "./node_modules/*" -not -path "./logs/*" -delete 2>/dev/null || true
echo -e "${GREEN}✓${NC} Cleaned temporary files"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Clean completed successfully!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run: npm run build"
echo "  2. Run: pm2 restart lms-nextjs"
echo "  Or use: ./scripts/build-and-deploy.sh"
echo ""
