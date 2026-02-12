#!/bin/bash

################################################################################
# Quick Fix Script for Missing CSS/Assets Issue
#
# Purpose: Quickly resolve the "missing CSS and static assets" issue that
#          occurs when PM2 is not restarted after a build.
#
# Usage: ./scripts/fix-missing-assets.sh [--clean]
#
# Options:
#   --clean    Perform a full clean rebuild (removes .next and caches)
#
# This script will:
# 1. Check current build and PM2 status
# 2. Restart PM2 (or rebuild if --clean)
# 3. Verify the fix worked
# 4. Provide next steps if issue persists
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="lms-nextjs"
CLEAN_BUILD=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--clean]"
            exit 1
            ;;
    esac
done

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   Quick Fix: Missing CSS/Assets Issue${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Diagnose the issue
echo -e "${BLUE}[Step 1]${NC} Diagnosing issue..."
echo ""

# Check if .next exists
if [ ! -d ".next" ]; then
    echo -e "${RED}✗${NC} .next directory not found"
    echo -e "${YELLOW}→${NC} Build has never been run or was deleted"
    echo -e "${YELLOW}→${NC} Running full build..."
    CLEAN_BUILD=true
else
    echo -e "${GREEN}✓${NC} .next directory exists"

    # Check BUILD_ID
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        BUILD_TIME=$(stat -c%y .next/BUILD_ID 2>/dev/null || stat -f%Sm -t "%Y-%m-%d %H:%M:%S" .next/BUILD_ID 2>/dev/null)
        echo -e "${GREEN}✓${NC} Build ID: ${BUILD_ID}"
        echo -e "${GREEN}✓${NC} Build time: ${BUILD_TIME}"
    else
        echo -e "${RED}✗${NC} BUILD_ID not found (incomplete build)"
        CLEAN_BUILD=true
    fi
fi

# Check PM2 status
echo ""
if pm2 describe "$APP_NAME" &> /dev/null; then
    PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
    PM2_UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.pm_uptime" 2>/dev/null || echo "unknown")

    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "${GREEN}✓${NC} PM2 status: online"

        # Calculate uptime in hours
        if [ "$PM2_UPTIME" != "unknown" ]; then
            CURRENT_TIME=$(date +%s)000
            UPTIME_MS=$((CURRENT_TIME - PM2_UPTIME))
            UPTIME_HOURS=$((UPTIME_MS / 3600000))
            echo -e "${GREEN}✓${NC} PM2 uptime: ~${UPTIME_HOURS} hours"

            if [ "$UPTIME_HOURS" -gt 1 ]; then
                echo -e "${YELLOW}⚠${NC} PM2 has been running for ${UPTIME_HOURS} hours"
                echo -e "${YELLOW}→${NC} May be serving an old build"
            fi
        fi
    else
        echo -e "${RED}✗${NC} PM2 status: $PM2_STATUS"
        echo -e "${YELLOW}→${NC} Application may be crashed or stopped"
    fi
else
    echo -e "${RED}✗${NC} PM2 process '$APP_NAME' not found"
    echo -e "${YELLOW}→${NC} Application needs to be started"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

# Step 2: Apply fix
if [ "$CLEAN_BUILD" = true ]; then
    echo -e "${BLUE}[Step 2]${NC} Performing clean rebuild..."
    echo ""

    # Run clean build script
    if [ -f "./scripts/clean-build.sh" ]; then
        ./scripts/clean-build.sh
    else
        echo -e "${YELLOW}⚠${NC} clean-build.sh not found, cleaning manually..."
        rm -rf .next
        rm -rf node_modules/.cache
        echo -e "${GREEN}✓${NC} Cleaned build artifacts"
    fi

    echo ""
    echo -e "${BLUE}[Step 3]${NC} Building application..."
    echo ""

    npm run build || {
        echo -e "${RED}✗${NC} Build failed"
        echo -e "${YELLOW}→${NC} Check build errors above"
        exit 1
    }

    echo -e "${GREEN}✓${NC} Build completed"
else
    echo -e "${BLUE}[Step 2]${NC} Skipping rebuild (build exists)"
    echo -e "${YELLOW}→${NC} Use --clean flag to force rebuild"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}[Step 3]${NC} Restarting PM2..."
echo ""

# Restart PM2
if pm2 describe "$APP_NAME" &> /dev/null; then
    pm2 restart "$APP_NAME" || {
        echo -e "${RED}✗${NC} Failed to restart PM2"
        exit 1
    }
    echo -e "${GREEN}✓${NC} PM2 restarted"
else
    echo -e "${YELLOW}⚠${NC} PM2 not running, starting..."
    pm2 start ecosystem.config.cjs --env production || {
        echo -e "${RED}✗${NC} Failed to start PM2"
        exit 1
    }
    pm2 save
    echo -e "${GREEN}✓${NC} PM2 started"
fi

# Wait for app to start
echo -e "${YELLOW}→${NC} Waiting for application to start..."
sleep 5

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}[Step 4]${NC} Verifying fix..."
echo ""

# Check health endpoint
MAX_RETRIES=5
RETRY_DELAY=3
HEALTH_CHECK_PASSED=false

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s "http://localhost:3001/api/health" > /dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s "http://localhost:3001/api/health" | jq '.' 2>/dev/null || echo "")
        echo -e "${GREEN}✓${NC} Health check passed"
        if [ -n "$HEALTH_RESPONSE" ]; then
            echo "$HEALTH_RESPONSE"
        fi
        HEALTH_CHECK_PASSED=true
        break
    else
        if [ $i -eq $MAX_RETRIES ]; then
            echo -e "${RED}✗${NC} Health check failed after $MAX_RETRIES attempts"
        else
            echo -e "${YELLOW}⚠${NC} Health check failed, retrying ($i/$MAX_RETRIES)..."
            sleep $RETRY_DELAY
        fi
    fi
done

echo ""

# Check PM2 status again
PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}✓${NC} PM2 status: online"
else
    echo -e "${RED}✗${NC} PM2 status: $PM2_STATUS"
    echo -e "${YELLOW}→${NC} Check PM2 logs: pm2 logs $APP_NAME"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

# Final verdict
if [ "$HEALTH_CHECK_PASSED" = true ] && [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ Issue Fixed Successfully!                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Clear your browser cache or use incognito mode"
    echo "  2. Navigate to: https://lms.gagneet.com"
    echo "  3. Open browser console (F12) and check for errors"
    echo "  4. If issue persists, purge CloudFlare cache:"
    echo "     → Login to CloudFlare → Caching → Purge Everything"
    echo ""
    echo -e "${BLUE}Verify with:${NC}"
    echo "  curl https://lms.gagneet.com/api/health"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ Issue NOT Fixed - Manual Investigation Required        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting Steps:${NC}"
    echo "  1. Check PM2 logs:"
    echo "     pm2 logs $APP_NAME --lines 50"
    echo ""
    echo "  2. Check if build files exist:"
    echo "     ls -lh .next/static/chunks/"
    echo ""
    echo "  3. Try full deployment:"
    echo "     ./scripts/build-and-deploy.sh"
    echo ""
    echo "  4. Check documentation:"
    echo "     docs/troubleshooting/missing-css-assets.md"
    echo ""
    exit 1
fi
