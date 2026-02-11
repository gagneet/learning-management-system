# Production Deployment Guide: LMS Application

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [Configuration Details](#configuration-details)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Security Considerations](#security-considerations)

## Overview

This document describes the production deployment of the LMS (Learning Management System) Next.js application to **https://lms.gagneet.com**.

### Deployment Stack

- **Application**: Next.js 14+ (Port 3001)
- **Database**: PostgreSQL (Port 5432)
- **Process Manager**: PM2 (Cluster mode)
- **Web Server**: Nginx (Ports 80/443)
- **CDN/SSL**: CloudFlare
- **Tunnel**: CloudFlare Tunnel
- **OS**: Linux (Ubuntu/Debian)

### Key Features

- ✅ Zero-downtime deployments with PM2 cluster mode
- ✅ Automatic rollback on deployment failure
- ✅ Health check monitoring
- ✅ Automated backup and restore
- ✅ Rate limiting and security headers
- ✅ SSL termination via CloudFlare
- ✅ Comprehensive logging

## Architecture

```
Internet
   ↓
CloudFlare (CDN + SSL + DDoS Protection)
   ↓
CloudFlare Tunnel
   ↓
Nginx (Port 80 HTTP, Port 443 HTTPS)
   ↓
LMS Next.js App (Port 3001, PM2 Cluster)
   ↓
PostgreSQL Database (Port 5432)
```

### Port Assignments

| Service | Port | Purpose |
|---------|------|---------|
| Next.js App | 3001 | Application server |
| PostgreSQL | 5432 | Database (existing instance) |
| Nginx HTTP | 80 | CloudFlare tunnel endpoint |
| Nginx HTTPS | 443 | Direct HTTPS access |

## Prerequisites

Before deploying, ensure the following are installed and configured:

### System Requirements

- **Node.js**: v18+ (check: `node -v`)
- **npm**: v9+ (check: `npm -v`)
- **PostgreSQL**: v14+ (check: `psql --version`)
- **PM2**: Latest (install: `npm install -g pm2`)
- **Nginx**: Latest (check: `nginx -v`)
- **CloudFlare Tunnel**: Configured (check: `sudo systemctl status cloudflared`)

### System Access

- Root or sudo access for nginx and system service configuration
- PostgreSQL admin access for database creation
- CloudFlare account access for DNS and tunnel configuration
- Git access to the repository

## Initial Setup

Follow these steps for the first-time deployment:

### Step 1: Database Setup

Create the production database and user:

```bash
cd /home/gagneet/lms
./scripts/database-setup.sh
```

This script will:
- Check PostgreSQL availability
- Create `lms_production` database
- Create `lms_user` with secure password
- Grant appropriate permissions
- Output the `DATABASE_URL` for environment configuration

**Important**: Save the `DATABASE_URL` output securely!

### Step 2: Environment Configuration

Generate the production environment file:

```bash
./scripts/generate-env-production.sh
```

This will:
- Create `.env.production` from template
- Generate `NEXTAUTH_SECRET`
- Prompt for `DATABASE_URL`
- Set proper file permissions (600)

**Manual verification**: Ensure the following are set in `.env.production`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://lms_user:PASSWORD@localhost:5432/lms_production?schema=public"
NEXTAUTH_URL=https://lms.gagneet.com
NEXTAUTH_SECRET="generated-secret"
NEXT_TELEMETRY_DISABLED=1
```

### Step 3: Nginx Configuration

Install the nginx configuration:

```bash
# Copy configuration
sudo cp /home/gagneet/lms/config/nginx/lms /etc/nginx/sites-available/lms

# Create symlink
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/lms

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: SSL Certificate Setup

#### Option A: CloudFlare Origin Certificate (Recommended)

1. Log in to CloudFlare Dashboard
2. Navigate to SSL/TLS → Origin Server
3. Create Certificate (select "lms.gagneet.com")
4. Save certificate and private key:

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Save certificate (copy from CloudFlare)
sudo nano /etc/nginx/ssl/lms.gagneet.com.pem

# Save private key (copy from CloudFlare)
sudo nano /etc/nginx/ssl/lms.gagneet.com.key

# Set permissions
sudo chmod 644 /etc/nginx/ssl/lms.gagneet.com.pem
sudo chmod 600 /etc/nginx/ssl/lms.gagneet.com.key

# Reload nginx
sudo systemctl reload nginx
```

#### Option B: Let's Encrypt (Alternative)

```bash
sudo certbot --nginx -d lms.gagneet.com
```

### Step 5: CloudFlare Tunnel Configuration

Add the LMS ingress rule to CloudFlare Tunnel:

```bash
sudo ./scripts/configure-cloudflare-tunnel.sh
```

This script will:
- Backup existing cloudflared config
- Add LMS ingress rule
- Validate configuration
- Restart cloudflared service

**Manual verification**:

```bash
# Check tunnel status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f
```

### Step 6: CloudFlare DNS Configuration

1. Log in to CloudFlare Dashboard
2. Navigate to DNS
3. Add CNAME record:
   - **Type**: CNAME
   - **Name**: lms
   - **Target**: Your tunnel ID (e.g., `tunnel-id.cfargotunnel.com`)
   - **Proxy status**: Proxied (orange cloud)

4. Configure SSL/TLS:
   - Navigate to SSL/TLS → Overview
   - Set mode to **Full (strict)** if using Origin Certificate
   - Set mode to **Full** if using Let's Encrypt

5. Enable security features:
   - Navigate to Security → WAF
   - Enable WAF rules
   - Enable DDoS protection
   - Enable Bot Fight Mode

### Step 7: Initial Deployment

Deploy the application for the first time:

```bash
cd /home/gagneet/lms

# Install dependencies
npm ci --production=false

# Generate Prisma client
npm run db:generate

# Run database migrations
npx prisma migrate deploy

# Seed database (optional, for demo data)
npm run db:seed

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions output by the command
```

### Step 8: Verify Deployment

Run verification checks:

```bash
# Check PM2 status
pm2 status lms-nextjs

# Check health endpoint locally
curl http://localhost:3001/api/health

# Check health endpoint through nginx
curl -H "Host: lms.gagneet.com" http://localhost:80/api/health

# Check public access
curl https://lms.gagneet.com/api/health

# View PM2 logs
pm2 logs lms-nextjs --lines 50

# View nginx logs
sudo tail -50 /var/log/nginx/lms_access.log
sudo tail -50 /var/log/nginx/lms_error.log
```

Expected health check response:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-10T20:00:00.000Z",
  "database": "connected",
  "uptime": 123.45,
  "version": "production",
  "responseTime": "45ms"
}
```

## Deployment Process

For subsequent deployments after initial setup:

### Quick Deployment

Use the automated deployment script:

```bash
cd /home/gagneet/lms
./scripts/build-and-deploy.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Create backup
3. ✅ Install dependencies
4. ✅ Generate Prisma client
5. ✅ Run migrations
6. ✅ Build application
7. ✅ Restart PM2
8. ✅ Verify health
9. ✅ Rollback on failure

### Deployment Options

```bash
# Skip backup (faster, but risky)
./scripts/build-and-deploy.sh --skip-backup

# Skip dependency installation (if no package changes)
./scripts/build-and-deploy.sh --skip-deps

# Skip database migrations (if no schema changes)
./scripts/build-and-deploy.sh --skip-migrations

# Combine options
./scripts/build-and-deploy.sh --skip-deps --skip-migrations
```

### Manual Deployment

If you prefer manual control:

```bash
# 1. Pull latest code
git pull origin master

# 2. Install dependencies
npm ci --production=false

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Build application
npm run build

# 6. Restart PM2
pm2 restart lms-nextjs

# 7. Verify health
./scripts/health-check.sh --verbose
```

## Configuration Details

### PM2 Configuration

Location: `/home/gagneet/lms/ecosystem.config.js`

Key settings:
- **Mode**: Cluster (all CPU cores)
- **Instances**: 'max' (auto-detect CPU cores)
- **Port**: 3001
- **Auto-restart**: Enabled
- **Max memory**: 1GB per instance
- **Logs**: `./logs/pm2-*.log`

Useful PM2 commands:

```bash
# View all processes
pm2 list

# View detailed info
pm2 describe lms-nextjs

# View logs
pm2 logs lms-nextjs
pm2 logs lms-nextjs --err  # Errors only
pm2 logs lms-nextjs --lines 100

# Monitor real-time
pm2 monit

# Restart
pm2 restart lms-nextjs

# Reload (zero-downtime)
pm2 reload lms-nextjs

# Stop
pm2 stop lms-nextjs

# Delete from PM2
pm2 delete lms-nextjs
```

### Nginx Configuration

Location: `/etc/nginx/sites-available/lms`

Key features:
- **Upstream**: localhost:3001 with keepalive
- **Rate limiting**:
  - Login: 5 req/min
  - API: 100 req/min
  - General: 200 req/min
- **Static file caching**: 1 year for `/_next/static/`
- **Client max body size**: 50MB
- **CloudFlare real IP**: Configured
- **Security headers**: X-Frame-Options, X-Content-Type-Options, HSTS

Test and reload nginx:

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/lms_access.log
sudo tail -f /var/log/nginx/lms_error.log
```

### Database Configuration

Connection pooling (Prisma default):
- Connection limit: 10
- Timeout: 5 seconds

Database maintenance:

```bash
# Connect to database
psql -h localhost -U lms_user -d lms_production

# View all tables
\dt

# View table schema
\d users

# Database size
SELECT pg_size_pretty(pg_database_size('lms_production'));

# Vacuum and analyze (optimize)
VACUUM ANALYZE;

# Backup database
pg_dump -h localhost -U lms_user lms_production > backup-$(date +%Y%m%d).sql

# Restore database
psql -h localhost -U lms_user -d lms_production < backup-20260210.sql
```

## Monitoring and Maintenance

### Daily Monitoring

Set up automated health checks with cron:

```bash
# Edit crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * /home/gagneet/lms/scripts/health-check.sh || echo "LMS health check failed" | mail -s "LMS Alert" admin@gagneet.com
```

Check application status:

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs lms-nextjs --lines 100 --err

# Health check
./scripts/health-check.sh --verbose

# Nginx status
sudo systemctl status nginx
```

### Weekly Maintenance

1. **Database Backup**:

```bash
# Create backup
pg_dump -h localhost -U lms_user lms_production | gzip > ~/backups/lms-db-$(date +%Y%m%d).sql.gz

# Keep last 4 weeks
find ~/backups -name "lms-db-*.sql.gz" -mtime +28 -delete
```

2. **Review Logs**:

```bash
# Check nginx error logs
sudo tail -100 /var/log/nginx/lms_error.log

# Check PM2 error logs
pm2 logs lms-nextjs --err --lines 100

# Check disk space
df -h /home/gagneet/lms
```

3. **Performance Check**:

```bash
# PM2 metrics
pm2 describe lms-nextjs

# Monitor for 30 seconds
pm2 monit
```

### Monthly Maintenance

1. **Security Updates**:

```bash
# Check for npm vulnerabilities
npm audit

# Fix vulnerabilities (review changes first!)
npm audit fix

# Update Prisma
npm update @prisma/client prisma

# Redeploy
./scripts/build-and-deploy.sh
```

2. **Log Rotation Verification**:

```bash
# Check if log rotation is working
ls -lh /var/log/nginx/lms*.log*
ls -lh /home/gagneet/lms/logs/
```

3. **Backup Cleanup**:

```bash
# List backups
./scripts/rollback.sh

# Old backups are auto-cleaned (keeps last 5)
# Manual cleanup if needed:
rm -rf /home/gagneet/lms/backups/backup-YYYYMMDD-HHMMSS
```

## Troubleshooting

### Issue: Application won't start

**Symptoms**: PM2 shows status "errored" or continuously restarts

**Diagnosis**:

```bash
# Check PM2 logs
pm2 logs lms-nextjs --err --lines 50

# Check if port is in use
sudo ss -tlnp | grep 3001

# Check environment file
cat .env.production | grep -v PASSWORD
```

**Solutions**:

```bash
# If port is in use, kill process
sudo kill -9 $(sudo lsof -t -i:3001)

# If environment issue, regenerate
./scripts/generate-env-production.sh

# Rebuild and restart
npm run build
pm2 restart lms-nextjs
```

### Issue: Health check fails

**Symptoms**: `/api/health` returns 503 or connection error

**Diagnosis**:

```bash
# Check PM2 status
pm2 status lms-nextjs

# Test database connection
psql -h localhost -U lms_user -d lms_production -c "SELECT 1;"

# Check logs
pm2 logs lms-nextjs --lines 50
```

**Solutions**:

```bash
# Restart PM2
pm2 restart lms-nextjs

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check DATABASE_URL in .env.production
grep DATABASE_URL .env.production
```

### Issue: Cannot access via https://lms.gagneet.com

**Symptoms**: Site not reachable or shows 502 Bad Gateway

**Diagnosis**:

```bash
# Check nginx
sudo systemctl status nginx
sudo nginx -t

# Check CloudFlare tunnel
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50

# Test local access
curl http://localhost:3001/api/health
curl -H "Host: lms.gagneet.com" http://localhost:80/api/health

# Check DNS
nslookup lms.gagneet.com
```

**Solutions**:

```bash
# Restart nginx
sudo systemctl restart nginx

# Restart CloudFlare tunnel
sudo systemctl restart cloudflared

# Check nginx error logs
sudo tail -50 /var/log/nginx/lms_error.log

# Verify CloudFlare DNS settings in dashboard
```

### Issue: 502 Bad Gateway

**Symptoms**: Nginx returns 502 error

**Diagnosis**:

```bash
# Check if PM2 is running
pm2 status lms-nextjs

# Check if port 3001 is listening
sudo ss -tlnp | grep 3001

# Check nginx error log
sudo tail -50 /var/log/nginx/lms_error.log
```

**Solutions**:

```bash
# Start PM2 if not running
pm2 start ecosystem.config.js --env production

# Restart nginx
sudo systemctl restart nginx

# Check firewall (if applicable)
sudo ufw status
```

### Issue: Database connection failed

**Symptoms**: Health check shows "database: disconnected"

**Diagnosis**:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U lms_user -d lms_production

# Check DATABASE_URL
grep DATABASE_URL .env.production

# Check Prisma client generation
ls -la node_modules/.prisma/
```

**Solutions**:

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Regenerate Prisma client
npm run db:generate

# Restart application
pm2 restart lms-nextjs
```

### Issue: Slow response times

**Symptoms**: Pages load slowly, API timeouts

**Diagnosis**:

```bash
# Check PM2 metrics
pm2 describe lms-nextjs

# Check system resources
top
htop
free -h
df -h

# Check database performance
psql -h localhost -U lms_user -d lms_production -c "SELECT * FROM pg_stat_activity;"
```

**Solutions**:

```bash
# Increase PM2 instances (if low CPU usage)
# Edit ecosystem.config.js, set instances to specific number
pm2 restart lms-nextjs

# Restart to free memory
pm2 restart lms-nextjs

# Optimize database
psql -h localhost -U lms_user -d lms_production -c "VACUUM ANALYZE;"

# Check nginx caching
sudo tail -f /var/log/nginx/lms_access.log
```

## Rollback Procedures

### Automatic Rollback

The deployment script automatically rolls back if deployment fails. Manual intervention is rarely needed.

### Manual Rollback

If you need to manually rollback:

#### Step 1: List Available Backups

```bash
./scripts/rollback.sh
```

This shows all available backups with metadata.

#### Step 2: Rollback to Specific Backup

```bash
# Rollback to latest
./scripts/rollback.sh latest

# Rollback to specific backup
./scripts/rollback.sh backup-20260210-120000
```

The rollback script will:
1. Stop PM2
2. Restore `.env.production`
3. Restore `package-lock.json` and reinstall deps
4. Restore `.next` build
5. Restart PM2
6. Verify health

#### Step 3: Verify Rollback

```bash
# Check PM2 status
pm2 status lms-nextjs

# Check health
./scripts/health-check.sh --verbose

# Check logs
pm2 logs lms-nextjs --lines 50
```

### Database Rollback

If you need to rollback database migrations:

```bash
# Create database backup first!
pg_dump -h localhost -U lms_user lms_production > pre-rollback-$(date +%Y%m%d).sql

# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
psql -h localhost -U lms_user -d lms_production < backup-20260210.sql

# Regenerate Prisma client
npm run db:generate

# Restart application
pm2 restart lms-nextjs
```

## Security Considerations

### Environment Variables

- ✅ Never commit `.env.production` to version control
- ✅ Store sensitive credentials in a secure password manager
- ✅ Rotate `NEXTAUTH_SECRET` periodically
- ✅ Use strong database passwords (20+ characters)

### File Permissions

```bash
# Environment file (owner read/write only)
chmod 600 .env.production

# Scripts (owner read/write/execute, group read/execute)
chmod 750 scripts/*.sh

# Logs (owner read/write, group/others read)
chmod 755 logs/
```

### Nginx Security

The nginx configuration includes:
- Rate limiting on login and API endpoints
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- HSTS for HTTPS enforcement
- Blocking of hidden files

### CloudFlare Security

Recommended settings:
- **SSL/TLS Mode**: Full (strict)
- **Always Use HTTPS**: Enabled
- **HSTS**: Enabled
- **WAF**: Enabled with OWASP ruleset
- **DDoS Protection**: Enabled
- **Bot Fight Mode**: Enabled
- **Rate Limiting**: Additional rules in CloudFlare dashboard

### Database Security

```bash
# Use SSL for database connection (if not on localhost)
# Add to DATABASE_URL: ?sslmode=require

# Regular security updates
sudo apt update && sudo apt upgrade postgresql

# Restrict PostgreSQL network access
# Edit /etc/postgresql/*/main/pg_hba.conf
# Ensure only localhost can connect
```

### Application Security

- ✅ Regular `npm audit` and security updates
- ✅ Keep Next.js, Prisma, and dependencies updated
- ✅ Review and test security patches before deploying
- ✅ Monitor error logs for suspicious activity
- ✅ Implement proper authentication and authorization
- ✅ Validate and sanitize all user inputs

### Monitoring for Security Events

```bash
# Monitor failed login attempts
pm2 logs lms-nextjs | grep "authentication failed"

# Monitor rate limit hits
sudo grep "429" /var/log/nginx/lms_access.log

# Monitor unusual traffic patterns
sudo tail -f /var/log/nginx/lms_access.log
```

## Additional Resources

### Useful Commands Cheat Sheet

```bash
# Deployment
./scripts/build-and-deploy.sh                 # Full deployment
./scripts/build-and-deploy.sh --skip-deps     # Skip dependencies

# Rollback
./scripts/rollback.sh                         # List backups
./scripts/rollback.sh latest                  # Rollback to latest

# Health Check
./scripts/health-check.sh                     # Quick check
./scripts/health-check.sh --verbose           # Detailed check

# PM2
pm2 status                                    # List all processes
pm2 logs lms-nextjs                           # View logs
pm2 restart lms-nextjs                        # Restart app
pm2 monit                                     # Real-time monitoring

# Nginx
sudo nginx -t                                 # Test config
sudo systemctl reload nginx                   # Reload config
sudo tail -f /var/log/nginx/lms_error.log     # View error log

# Database
psql -h localhost -U lms_user -d lms_production  # Connect to DB
npx prisma studio                             # GUI database browser
npx prisma migrate status                     # Check migration status

# System
df -h                                         # Disk space
free -h                                       # Memory usage
top                                           # CPU and memory
sudo ss -tlnp | grep :3001                    # Check port
```

### Related Documentation

- [Main README](../README.md)
- [Development Guide](../DEPLOYMENT.md)
- [API Documentation](./api/)
- [Database Schema](../prisma/schema.prisma)

### Support

For issues or questions:
- Check this documentation first
- Review application logs: `pm2 logs lms-nextjs`
- Review nginx logs: `/var/log/nginx/lms_error.log`
- Review CloudFlare tunnel logs: `sudo journalctl -u cloudflared -n 100`

---

**Last Updated**: 2026-02-10
**Version**: 1.0
**Maintainer**: Gagneet
