#!/bin/bash

#######################################
# Configure CloudFlare Tunnel for LMS
#
# This script adds the LMS ingress rule to /etc/cloudflared/config.yml
# and restarts the cloudflared service.
#
# Usage: sudo ./scripts/configure-cloudflare-tunnel.sh
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root${NC}"
    echo "Usage: sudo ./scripts/configure-cloudflare-tunnel.sh"
    exit 1
fi

CONFIG_FILE="/etc/cloudflared/config.yml"
BACKUP_FILE="/etc/cloudflared/config.yml.backup.$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}=== Configure CloudFlare Tunnel for LMS ===${NC}\n"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: CloudFlare config file not found at $CONFIG_FILE${NC}"
    exit 1
fi

# Backup existing config
echo -e "${YELLOW}Backing up existing config...${NC}"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}\n"

# Check if LMS rule already exists
if grep -q "lms.gagneet.com" "$CONFIG_FILE"; then
    echo -e "${YELLOW}Warning: LMS ingress rule already exists in config${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted${NC}"
        exit 1
    fi
else
    # Add LMS ingress rule before the catch-all rule
    echo -e "${YELLOW}Adding LMS ingress rule...${NC}"

    # Create temporary file with new rule
    cat > /tmp/lms-ingress-rule.txt << 'EOF'
  - hostname: lms.gagneet.com
    service: http://localhost:80
    originRequest:
      connectTimeout: 30s
      tcpKeepAlive: 30s
      noHappyEyeballs: false
      keepAliveTimeout: 90s
      keepAliveConnections: 100
      httpHostHeader: lms.gagneet.com
      originServerName: lms.gagneet.com
      noTLSVerify: true
EOF

    # Insert before the catch-all rule (service: http_status:404)
    # Using awk to insert before the catch-all
    awk '
        /^  - service: http_status:404/ {
            while ((getline line < "/tmp/lms-ingress-rule.txt") > 0) {
                print line
            }
            close("/tmp/lms-ingress-rule.txt")
        }
        { print }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.new"

    # Replace original file
    mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
    rm /tmp/lms-ingress-rule.txt

    echo -e "${GREEN}✓ Ingress rule added${NC}\n"
fi

# Validate config
echo -e "${YELLOW}Validating CloudFlare config...${NC}"
if cloudflared tunnel ingress validate; then
    echo -e "${GREEN}✓ Configuration is valid${NC}\n"
else
    echo -e "${RED}Error: Configuration validation failed${NC}"
    echo "Restoring backup..."
    mv "$BACKUP_FILE" "$CONFIG_FILE"
    echo -e "${YELLOW}Backup restored${NC}"
    exit 1
fi

# Restart cloudflared service
echo -e "${YELLOW}Restarting cloudflared service...${NC}"
if systemctl restart cloudflared; then
    echo -e "${GREEN}✓ Service restarted${NC}\n"
else
    echo -e "${RED}Error: Failed to restart service${NC}"
    exit 1
fi

# Check service status
echo -e "${YELLOW}Checking service status...${NC}"
sleep 2
if systemctl is-active --quiet cloudflared; then
    echo -e "${GREEN}✓ CloudFlare tunnel is running${NC}\n"
else
    echo -e "${RED}Error: CloudFlare tunnel is not running${NC}"
    echo "Check logs with: sudo journalctl -u cloudflared -n 50"
    exit 1
fi

echo -e "${GREEN}=== Configuration Complete ===${NC}\n"
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Verify tunnel routing: sudo journalctl -u cloudflared -f"
echo "  2. Configure DNS in CloudFlare dashboard"
echo "  3. Test access: curl -I https://lms.gagneet.com/api/health"
echo ""
echo -e "${YELLOW}Backup saved to: $BACKUP_FILE${NC}"
