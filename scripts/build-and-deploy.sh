#!/bin/bash

#######################################
# LMS Build and Deploy Script
#
# This script handles the complete deployment process:
# - Prerequisites check
# - Backup current deployment
# - Install dependencies
# - Generate Prisma client
# - Run database migrations
# - Build application
# - Restart PM2
# - Health verification
# - Automatic rollback on failure
#
# Usage: ./scripts/build-and-deploy.sh [--skip-backup] [--skip-deps] [--skip-migrations]
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
MAX_BACKUPS=5

# Parse command line arguments
SKIP_BACKUP=false
SKIP_DEPS=false
SKIP_MIGRATIONS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--skip-backup] [--skip-deps] [--skip-migrations]"
            exit 1
            ;;
    esac
done

# Change to app directory
cd "$APP_DIR"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   LMS Build and Deploy Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

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

# Function to rollback
rollback() {
    print_error "Deployment failed! Starting rollback..."

    if [ -f "$BACKUP_DIR/latest" ]; then
        LATEST_BACKUP=$(cat "$BACKUP_DIR/latest")
        if [ -d "$BACKUP_DIR/$LATEST_BACKUP" ]; then
            print_step "Rolling back to $LATEST_BACKUP"
            ./scripts/rollback.sh "$LATEST_BACKUP" || {
                print_error "Rollback failed!"
                exit 1
            }
            print_success "Rollback completed"
        else
            print_error "Backup not found: $LATEST_BACKUP"
        fi
    else
        print_warning "No backup available for rollback"
    fi

    exit 1
}

# Set trap for errors
trap rollback ERR

# Step 1: Prerequisites Check
print_step "Step 1/9: Checking prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm -v)
print_success "npm: $NPM_VERSION"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed"
    echo "Install with: npm install -g pm2"
    exit 1
fi
PM2_VERSION=$(pm2 -v)
print_success "PM2: $PM2_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client is not installed"
    exit 1
fi
print_success "PostgreSQL client available"

# Check .env.production
if [ ! -f "$APP_DIR/.env.production" ]; then
    print_error ".env.production not found"
    echo "Create it with: ./scripts/generate-env-production.sh"
    exit 1
fi
print_success ".env.production exists"

# Check DATABASE_URL
if ! grep -q "^DATABASE_URL=" "$APP_DIR/.env.production"; then
    print_error "DATABASE_URL not set in .env.production"
    exit 1
fi
print_success "DATABASE_URL configured"

# Step 2: Package Update Check
print_step "Step 2/9: Checking for package updates"

if [ -f "package-lock.json" ]; then
    # Check if package.json is newer than package-lock.json
    if [ "package.json" -nt "package-lock.json" ]; then
        print_warning "package.json is newer than package-lock.json"
        print_warning "This might indicate package updates"
    else
        print_success "Package files are in sync"
    fi
else
    print_warning "package-lock.json not found"
fi

# Step 3: Backup Current Deployment
if [ "$SKIP_BACKUP" = false ]; then
    print_step "Step 3/9: Creating backup"

    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    mkdir -p "$BACKUP_PATH"

    # Backup critical files
    if [ -f ".env.production" ]; then
        cp .env.production "$BACKUP_PATH/" 2>/dev/null || true
    fi

    if [ -f "package-lock.json" ]; then
        cp package-lock.json "$BACKUP_PATH/" 2>/dev/null || true
    fi

    if [ -d ".next" ]; then
        cp -r .next "$BACKUP_PATH/" 2>/dev/null || true
    fi

    # Create metadata
    cat > "$BACKUP_PATH/metadata.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "node_version": "$NODE_VERSION",
  "npm_version": "$NPM_VERSION"
}
EOF

    # Mark as latest backup
    echo "$BACKUP_NAME" > "$BACKUP_DIR/latest"

    print_success "Backup created: $BACKUP_NAME"

    # Cleanup old backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | grep "^backup-" | wc -l)
    if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
        print_step "Cleaning up old backups (keeping last $MAX_BACKUPS)"
        cd "$BACKUP_DIR"
        ls -1t | grep "^backup-" | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf
        cd "$APP_DIR"
        print_success "Old backups cleaned"
    fi
else
    print_warning "Step 3/9: Skipping backup (--skip-backup)"
fi

# Step 4: Install Dependencies
if [ "$SKIP_DEPS" = false ]; then
    print_step "Step 4/9: Installing dependencies"

    npm ci --production=false || {
        print_error "Failed to install dependencies"
        exit 1
    }

    print_success "Dependencies installed"
else
    print_warning "Step 4/9: Skipping dependencies (--skip-deps)"
fi

# Step 5: Generate Prisma Client
print_step "Step 5/9: Generating Prisma client"

npm run db:generate || {
    print_error "Failed to generate Prisma client"
    exit 1
}

print_success "Prisma client generated"

# Step 6: Database Migrations
if [ "$SKIP_MIGRATIONS" = false ]; then
    print_step "Step 6/9: Checking database migrations"

    # Load production environment
    export $(grep -v '^#' .env.production | xargs)

    # Check for pending migrations
    if npx prisma migrate status 2>&1 | grep -q "pending"; then
        print_warning "Pending migrations detected"

        # Run migrations
        print_step "Running database migrations"
        npx prisma migrate deploy || {
            print_error "Failed to run migrations"
            exit 1
        }

        print_success "Migrations applied"
    else
        print_success "Database is up to date"
    fi

    # Unset environment variables
    unset $(grep -v '^#' .env.production | sed -E 's/(.*)=.*/\1/' | xargs)
else
    print_warning "Step 6/9: Skipping migrations (--skip-migrations)"
fi

# Step 7: Build Application
print_step "Step 7/9: Building application"

# Clean previous build for fresh CSS generation (Tailwind CSS)
if [ -d ".next" ]; then
    print_step "Cleaning previous build (.next directory)"
    rm -rf .next
    print_success "Previous build cleaned"
fi

# Build application
npm run build || {
    print_error "Failed to build application"
    exit 1
}

# Verify CSS file size (should be > 15KB with Tailwind v3)
CSS_FILES=$(find .next/static/chunks -name "*.css" 2>/dev/null || true)
if [ -n "$CSS_FILES" ]; then
    for css_file in $CSS_FILES; do
        CSS_SIZE=$(stat -f%z "$css_file" 2>/dev/null || stat -c%s "$css_file" 2>/dev/null)
        if [ "$CSS_SIZE" -lt 15000 ]; then
            print_warning "CSS file is smaller than expected ($CSS_SIZE bytes)"
            print_warning "This may indicate Tailwind CSS compilation issues"
            print_warning "Expected size: ~21KB with Tailwind v3"
        else
            print_success "CSS generated successfully ($CSS_SIZE bytes)"
        fi
    done
fi

print_success "Application built successfully"

# Step 8: Restart PM2
print_step "Step 8/9: Restarting PM2 application"

# Check if app is running
if pm2 describe "$APP_NAME" &> /dev/null; then
    print_step "Restarting existing PM2 process"
    pm2 restart ecosystem.config.cjs --env production || {
        print_error "Failed to restart PM2"
        exit 1
    }
else
    print_step "Starting new PM2 process"
    pm2 start ecosystem.config.cjs --env production || {
        print_error "Failed to start PM2"
        exit 1
    }
    pm2 save
fi

print_success "PM2 restarted"

# Give the app time to start
sleep 5

# Step 9: Health Verification
print_step "Step 9/9: Verifying deployment health"

# Run health check script
if [ -f "./scripts/health-check.sh" ]; then
    if ./scripts/health-check.sh; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
else
    # Manual health check
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
                exit 1
            else
                print_warning "Health check failed, retrying in ${RETRY_DELAY}s (attempt $i/$MAX_RETRIES)"
                sleep $RETRY_DELAY
            fi
        fi
    done
fi

# Check PM2 status
PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
if [ "$PM2_STATUS" = "online" ]; then
    print_success "PM2 status: online"
else
    print_error "PM2 status: $PM2_STATUS"
    exit 1
fi

# Disable trap
trap - ERR

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Successful! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Application Details:${NC}"
echo "  Name: $APP_NAME"
echo "  Status: $PM2_STATUS"
echo "  Port: 3001"
echo "  URL: https://lms.gagneet.com"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs: pm2 logs $APP_NAME"
echo "  Monitor: pm2 monit"
echo "  Status: pm2 status"
echo "  Restart: pm2 restart $APP_NAME"
echo "  Stop: pm2 stop $APP_NAME"
echo ""
echo -e "${BLUE}Health Check:${NC}"
echo "  Local: curl http://localhost:3001/api/health"
echo "  Public: curl https://lms.gagneet.com/api/health"
echo ""
