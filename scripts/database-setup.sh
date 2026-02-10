#!/bin/bash

#######################################
# LMS Database Setup Script
#
# This script creates the production database and user for the LMS application.
# It checks PostgreSQL availability, creates the database, creates a user with
# secure permissions, and outputs the DATABASE_URL for use in .env.production.
#
# Usage: ./scripts/database-setup.sh
#######################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="lms_production"
DB_USER="lms_user"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}=== LMS Production Database Setup ===${NC}\n"

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL status...${NC}"
if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${RED}Error: PostgreSQL is not running${NC}"
    echo "Start it with: sudo systemctl start postgresql"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}\n"

# Generate a secure random password
echo -e "${YELLOW}Generating secure password...${NC}"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo -e "${GREEN}✓ Password generated${NC}\n"

# Check if database already exists
echo -e "${YELLOW}Checking if database exists...${NC}"
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}Warning: Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to continue and reset the password for $DB_USER? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted${NC}"
        exit 1
    fi
else
    # Create database
    echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
        echo -e "${RED}Error: Failed to create database${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database created${NC}\n"
fi

# Check if user already exists
echo -e "${YELLOW}Checking if user exists...${NC}"
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${YELLOW}User '$DB_USER' already exists, updating password...${NC}"
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || {
        echo -e "${RED}Error: Failed to update user password${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ User password updated${NC}\n"
else
    # Create user
    echo -e "${YELLOW}Creating user '$DB_USER'...${NC}"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || {
        echo -e "${RED}Error: Failed to create user${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ User created${NC}\n"
fi

# Grant privileges
echo -e "${YELLOW}Granting privileges...${NC}"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || {
    echo -e "${RED}Error: Failed to grant privileges${NC}"
    exit 1
}

# Grant schema privileges (required for Prisma)
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" || {
    echo -e "${RED}Error: Failed to grant schema privileges${NC}"
    exit 1
}

sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;" || {
    echo -e "${YELLOW}Warning: No tables exist yet (expected for new database)${NC}"
}

sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;" || {
    echo -e "${YELLOW}Warning: No sequences exist yet (expected for new database)${NC}"
}

# Set default privileges for future objects
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" || {
    echo -e "${YELLOW}Warning: Could not set default table privileges${NC}"
}

sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;" || {
    echo -e "${YELLOW}Warning: Could not set default sequence privileges${NC}"
}

echo -e "${GREEN}✓ Privileges granted${NC}\n"

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1 || {
    echo -e "${RED}Error: Failed to connect to database${NC}"
    exit 1
}
echo -e "${GREEN}✓ Connection successful${NC}\n"

# Generate DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Output results
echo -e "${GREEN}=== Database Setup Complete ===${NC}\n"
echo -e "${BLUE}Database Details:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""
echo -e "${BLUE}Add this to your .env.production file:${NC}"
echo ""
echo -e "${YELLOW}DATABASE_URL=\"${DATABASE_URL}\"${NC}"
echo ""
echo -e "${RED}IMPORTANT: Save this DATABASE_URL securely!${NC}"
echo -e "${RED}The password will not be shown again.${NC}"
echo ""

# Optionally save to a secure file
read -p "Do you want to save DATABASE_URL to .env.production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "/home/gagneet/lms/.env.production" ]; then
        # Check if DATABASE_URL already exists
        if grep -q "^DATABASE_URL=" "/home/gagneet/lms/.env.production"; then
            # Update existing DATABASE_URL
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "/home/gagneet/lms/.env.production"
            echo -e "${GREEN}✓ DATABASE_URL updated in .env.production${NC}"
        else
            # Append DATABASE_URL
            echo "DATABASE_URL=\"${DATABASE_URL}\"" >> "/home/gagneet/lms/.env.production"
            echo -e "${GREEN}✓ DATABASE_URL added to .env.production${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: .env.production does not exist yet${NC}"
        echo "Create it first with: cp .env.example .env.production"
    fi
fi

echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Add DATABASE_URL to .env.production (if not done above)"
echo "  2. Run: npm run db:generate"
echo "  3. Run: npx prisma migrate deploy"
echo "  4. Run: npm run db:seed (optional)"
