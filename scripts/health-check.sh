#!/bin/bash

#######################################
# LMS Health Check Script
#
# This script checks the health of the LMS application by querying
# the health endpoint. It retries on failure and returns appropriate
# exit codes for monitoring systems.
#
# Exit codes:
#   0 - Healthy
#   1 - Unhealthy
#   2 - Connection error
#
# Usage:
#   ./scripts/health-check.sh [--url URL] [--retries N] [--delay N] [--verbose]
#
# Examples:
#   ./scripts/health-check.sh
#   ./scripts/health-check.sh --url https://lms.gagneet.com/api/health
#   ./scripts/health-check.sh --retries 5 --delay 2 --verbose
#######################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
HEALTH_URL="http://localhost:3001/api/health"
MAX_RETRIES=3
RETRY_DELAY=2
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            HEALTH_URL="$2"
            shift 2
            ;;
        --retries)
            MAX_RETRIES="$2"
            shift 2
            ;;
        --delay)
            RETRY_DELAY="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "LMS Health Check Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --url URL         Health check URL (default: http://localhost:3001/api/health)"
            echo "  --retries N       Number of retry attempts (default: 3)"
            echo "  --delay N         Delay between retries in seconds (default: 2)"
            echo "  --verbose, -v     Show detailed output"
            echo "  --help, -h        Show this help"
            echo ""
            echo "Exit codes:"
            echo "  0 - Healthy"
            echo "  1 - Unhealthy"
            echo "  2 - Connection error"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 2
            ;;
    esac
done

# Function to print verbose message
print_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "$1"
    fi
}

# Function to perform health check
check_health() {
    local attempt=$1

    print_verbose "${BLUE}[Attempt $attempt/$MAX_RETRIES]${NC} Checking health at: $HEALTH_URL"

    # Perform HTTP request
    RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" 2>&1)
    CURL_EXIT=$?

    if [ $CURL_EXIT -ne 0 ]; then
        print_verbose "${RED}✖${NC} Connection error (curl exit code: $CURL_EXIT)"
        return 2
    fi

    # Extract HTTP status code (last line)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    # Extract response body (all but last line)
    BODY=$(echo "$RESPONSE" | head -n-1)

    print_verbose "${BLUE}HTTP Status:${NC} $HTTP_CODE"

    if [ "$HTTP_CODE" -eq 200 ]; then
        # Parse response to check status field
        if command -v jq &> /dev/null; then
            STATUS=$(echo "$BODY" | jq -r '.status // "unknown"' 2>/dev/null)
            DATABASE=$(echo "$BODY" | jq -r '.database // "unknown"' 2>/dev/null)
            UPTIME=$(echo "$BODY" | jq -r '.uptime // "unknown"' 2>/dev/null)
            RESPONSE_TIME=$(echo "$BODY" | jq -r '.responseTime // "unknown"' 2>/dev/null)

            if [ "$VERBOSE" = true ]; then
                echo -e "${GREEN}✓${NC} Health check passed"
                echo -e "  Status: $STATUS"
                echo -e "  Database: $DATABASE"
                echo -e "  Uptime: ${UPTIME}s"
                echo -e "  Response Time: $RESPONSE_TIME"
            fi

            if [ "$STATUS" = "healthy" ]; then
                return 0
            else
                print_verbose "${RED}✖${NC} Status is not healthy: $STATUS"
                return 1
            fi
        else
            # jq not available, just check HTTP status
            print_verbose "${GREEN}✓${NC} Health check passed (HTTP 200)"
            return 0
        fi
    elif [ "$HTTP_CODE" -eq 503 ]; then
        print_verbose "${RED}✖${NC} Service unavailable (HTTP 503)"
        if [ "$VERBOSE" = true ] && command -v jq &> /dev/null; then
            ERROR=$(echo "$BODY" | jq -r '.error // "unknown"' 2>/dev/null)
            echo -e "  Error: $ERROR"
        fi
        return 1
    else
        print_verbose "${RED}✖${NC} Unexpected HTTP status: $HTTP_CODE"
        return 1
    fi
}

# Main health check loop
for attempt in $(seq 1 $MAX_RETRIES); do
    check_health $attempt
    RESULT=$?

    if [ $RESULT -eq 0 ]; then
        # Success
        if [ "$VERBOSE" = false ]; then
            echo "healthy"
        fi
        exit 0
    elif [ $RESULT -eq 2 ]; then
        # Connection error
        if [ $attempt -lt $MAX_RETRIES ]; then
            print_verbose "${YELLOW}⚠${NC} Retrying in ${RETRY_DELAY}s...\n"
            sleep $RETRY_DELAY
        else
            if [ "$VERBOSE" = false ]; then
                echo "connection_error"
            fi
            exit 2
        fi
    else
        # Unhealthy
        if [ $attempt -lt $MAX_RETRIES ]; then
            print_verbose "${YELLOW}⚠${NC} Retrying in ${RETRY_DELAY}s...\n"
            sleep $RETRY_DELAY
        else
            if [ "$VERBOSE" = false ]; then
                echo "unhealthy"
            fi
            exit 1
        fi
    fi
done

# Should not reach here, but just in case
if [ "$VERBOSE" = false ]; then
    echo "unknown"
fi
exit 1
