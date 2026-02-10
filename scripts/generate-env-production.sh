#!/bin/bash

#######################################
# Generate .env.production File
#
# This script creates a .env.production file with generated secrets.
# It prompts for DATABASE_URL if not already set.
#
# Usage: ./scripts/generate-env-production.sh
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV_FILE="/home/gagneet/lms/.env.production"
TEMPLATE_FILE="/home/gagneet/lms/.env.production.template"

echo -e "${BLUE}=== Generate Production Environment File ===${NC}\n"

# Check if .env.production already exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: .env.production already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted${NC}"
        exit 1
    fi
    # Backup existing file
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    echo -e "${GREEN}✓ Backed up existing file${NC}\n"
fi

# Copy template
cp "$TEMPLATE_FILE" "$ENV_FILE"
echo -e "${GREEN}✓ Created .env.production from template${NC}\n"

# Generate NEXTAUTH_SECRET
echo -e "${YELLOW}Generating NEXTAUTH_SECRET...${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET}\"|" "$ENV_FILE"
echo -e "${GREEN}✓ NEXTAUTH_SECRET generated${NC}\n"

# Prompt for DATABASE_URL
echo -e "${YELLOW}DATABASE_URL Configuration${NC}"
echo "If you haven't run ./scripts/database-setup.sh yet, run it first."
read -p "Do you have your DATABASE_URL? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter DATABASE_URL: " DATABASE_URL
    # Escape special characters for sed
    ESCAPED_URL=$(echo "$DATABASE_URL" | sed 's/[&/\]/\\&/g')
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "$ENV_FILE"
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}\n"
else
    echo -e "${YELLOW}Skipping DATABASE_URL - you'll need to add it manually${NC}\n"
fi

# Set proper permissions
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✓ Set file permissions to 600${NC}\n"

echo -e "${GREEN}=== Environment File Created ===${NC}\n"
echo -e "${BLUE}File location: ${ENV_FILE}${NC}\n"
echo -e "${YELLOW}Important:${NC}"
echo "  1. Review the file and add any optional configurations"
echo "  2. Make sure DATABASE_URL is set correctly"
echo "  3. Never commit this file to version control"
echo ""
echo -e "${BLUE}To view the file:${NC}"
echo "  cat $ENV_FILE"
