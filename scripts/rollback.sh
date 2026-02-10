#!/bin/bash

#######################################
# LMS Rollback Script
#
# This script restores the application from a previous backup.
# It can list available backups or restore from a specific backup.
#
# Usage:
#   ./scripts/rollback.sh                  # List available backups
#   ./scripts/rollback.sh <backup-name>    # Restore from backup
#   ./scripts/rollback.sh latest           # Restore from latest backup
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="lms-nextjs"
APP_DIR="/home/gagneet/lms"
BACKUP_DIR="$APP_DIR/backups"

# Change to app directory
cd "$APP_DIR"

# Function to print step
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✖ $1${NC}"
}

# Function to list backups
list_backups() {
    echo -e "${BLUE}=== Available Backups ===${NC}\n"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null | grep '^backup-')" ]; then
        echo -e "${YELLOW}No backups found${NC}"
        exit 0
    fi

    # Get latest backup
    LATEST=""
    if [ -f "$BACKUP_DIR/latest" ]; then
        LATEST=$(cat "$BACKUP_DIR/latest")
    fi

    # List backups with details
    cd "$BACKUP_DIR"
    for backup in $(ls -1t | grep "^backup-"); do
        if [ -d "$backup" ]; then
            TIMESTAMP=$(echo "$backup" | sed 's/backup-//')
            SIZE=$(du -sh "$backup" | cut -f1)

            MARKER=""
            if [ "$backup" = "$LATEST" ]; then
                MARKER="${GREEN}(latest)${NC}"
            fi

            echo -e "${BLUE}$backup${NC} $MARKER"
            echo "  Size: $SIZE"

            # Show metadata if available
            if [ -f "$backup/metadata.json" ]; then
                GIT_COMMIT=$(jq -r '.git_commit // "unknown"' "$backup/metadata.json" 2>/dev/null || echo "unknown")
                GIT_BRANCH=$(jq -r '.git_branch // "unknown"' "$backup/metadata.json" 2>/dev/null || echo "unknown")
                echo "  Git: $GIT_BRANCH @ ${GIT_COMMIT:0:7}"
                BACKUP_TIME=$(jq -r '.timestamp // "unknown"' "$backup/metadata.json" 2>/dev/null || echo "unknown")
                echo "  Created: $BACKUP_TIME"
            fi

            echo ""
        fi
    done
    cd "$APP_DIR"

    echo -e "${BLUE}Usage:${NC}"
    echo "  ./scripts/rollback.sh <backup-name>"
    echo "  ./scripts/rollback.sh latest"
}

# Function to restore backup
restore_backup() {
    local BACKUP_NAME=$1
    local BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   LMS Rollback Script                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

    # Check if backup exists
    if [ ! -d "$BACKUP_PATH" ]; then
        print_error "Backup not found: $BACKUP_NAME"
        echo ""
        list_backups
        exit 1
    fi

    print_step "Backup: $BACKUP_NAME"

    # Show backup metadata
    if [ -f "$BACKUP_PATH/metadata.json" ]; then
        echo ""
        cat "$BACKUP_PATH/metadata.json" | jq '.' || cat "$BACKUP_PATH/metadata.json"
        echo ""
    fi

    # Confirm rollback
    echo -e "${YELLOW}WARNING: This will restore the application to the backup state.${NC}"
    echo -e "${YELLOW}Current state will be lost!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${RED}Rollback cancelled${NC}"
        exit 1
    fi

    # Step 1: Stop PM2
    print_step "Step 1/5: Stopping PM2 application"

    if pm2 describe "$APP_NAME" &> /dev/null; then
        pm2 stop "$APP_NAME" || {
            print_warning "Failed to stop PM2 (continuing anyway)"
        }
        print_success "PM2 stopped"
    else
        print_warning "PM2 application not running"
    fi

    # Step 2: Restore .env.production
    if [ -f "$BACKUP_PATH/.env.production" ]; then
        print_step "Step 2/5: Restoring .env.production"
        cp "$BACKUP_PATH/.env.production" "$APP_DIR/.env.production"
        chmod 600 "$APP_DIR/.env.production"
        print_success ".env.production restored"
    else
        print_warning "Step 2/5: No .env.production in backup"
    fi

    # Step 3: Restore package-lock.json
    if [ -f "$BACKUP_PATH/package-lock.json" ]; then
        print_step "Step 3/5: Restoring package-lock.json"
        cp "$BACKUP_PATH/package-lock.json" "$APP_DIR/package-lock.json"
        print_success "package-lock.json restored"

        # Reinstall dependencies
        print_step "Reinstalling dependencies"
        npm ci --production=false || {
            print_error "Failed to reinstall dependencies"
            exit 1
        }
        print_success "Dependencies reinstalled"
    else
        print_warning "Step 3/5: No package-lock.json in backup"
    fi

    # Step 4: Restore .next build
    if [ -d "$BACKUP_PATH/.next" ]; then
        print_step "Step 4/5: Restoring .next build"

        # Remove current build
        if [ -d "$APP_DIR/.next" ]; then
            rm -rf "$APP_DIR/.next"
        fi

        # Restore backup build
        cp -r "$BACKUP_PATH/.next" "$APP_DIR/.next"
        print_success ".next build restored"
    else
        print_warning "Step 4/5: No .next build in backup"
        print_step "Rebuilding application"
        npm run build || {
            print_error "Failed to rebuild application"
            exit 1
        }
        print_success "Application rebuilt"
    fi

    # Step 5: Restart PM2
    print_step "Step 5/5: Restarting PM2 application"

    pm2 restart ecosystem.config.js --env production || {
        print_error "Failed to restart PM2"
        exit 1
    }

    print_success "PM2 restarted"

    # Give the app time to start
    sleep 5

    # Step 6: Health Verification
    print_step "Verifying application health"

    HEALTH_URL="http://localhost:3001/api/health"
    MAX_RETRIES=5
    RETRY_DELAY=3

    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
            print_success "Health check passed (attempt $i/$MAX_RETRIES)"
            break
        else
            if [ $i -eq $MAX_RETRIES ]; then
                print_error "Health check failed after $MAX_RETRIES attempts"
                echo ""
                echo -e "${RED}Rollback completed but health check failed!${NC}"
                echo -e "${YELLOW}Check PM2 logs: pm2 logs $APP_NAME${NC}"
                exit 1
            else
                print_warning "Health check failed, retrying in ${RETRY_DELAY}s (attempt $i/$MAX_RETRIES)"
                sleep $RETRY_DELAY
            fi
        fi
    done

    # Success message
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Rollback Successful! ✓               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Application Details:${NC}"
    echo "  Backup: $BACKUP_NAME"
    echo "  Status: online"
    echo "  URL: https://lms.gagneet.com"
    echo ""
    echo -e "${BLUE}Check Status:${NC}"
    echo "  pm2 logs $APP_NAME"
    echo "  pm2 status"
    echo ""
}

# Main script logic
if [ $# -eq 0 ]; then
    # No arguments - list backups
    list_backups
elif [ "$1" = "latest" ]; then
    # Restore latest backup
    if [ -f "$BACKUP_DIR/latest" ]; then
        LATEST_BACKUP=$(cat "$BACKUP_DIR/latest")
        restore_backup "$LATEST_BACKUP"
    else
        print_error "No latest backup found"
        list_backups
        exit 1
    fi
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    # Show help
    echo "LMS Rollback Script"
    echo ""
    echo "Usage:"
    echo "  $0                   List available backups"
    echo "  $0 <backup-name>     Restore from specific backup"
    echo "  $0 latest            Restore from latest backup"
    echo "  $0 --help            Show this help"
    echo ""
else
    # Restore specific backup
    restore_backup "$1"
fi
