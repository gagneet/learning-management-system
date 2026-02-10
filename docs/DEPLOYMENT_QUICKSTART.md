# Production Deployment Quick Start

This is a quick reference guide for deploying the LMS application to production. For comprehensive documentation, see [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md).

## Initial Setup (First Time Only)

### 1. Database Setup
```bash
cd /home/gagneet/lms
./scripts/database-setup.sh
```
Save the `DATABASE_URL` output!

### 2. Environment Configuration
```bash
./scripts/generate-env-production.sh
```
Enter the `DATABASE_URL` when prompted.

### 3. Nginx Configuration
```bash
sudo cp config/nginx/lms /etc/nginx/sites-available/lms
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/lms
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate
Upload CloudFlare Origin Certificate:
```bash
sudo mkdir -p /etc/nginx/ssl
sudo nano /etc/nginx/ssl/lms.gagneet.com.pem    # Paste certificate
sudo nano /etc/nginx/ssl/lms.gagneet.com.key    # Paste private key
sudo chmod 644 /etc/nginx/ssl/lms.gagneet.com.pem
sudo chmod 600 /etc/nginx/ssl/lms.gagneet.com.key
sudo systemctl reload nginx
```

### 5. CloudFlare Tunnel
```bash
sudo ./scripts/configure-cloudflare-tunnel.sh
```

### 6. Initial Deployment
```bash
npm ci --production=false
npm run db:generate
npx prisma migrate deploy
npm run db:seed  # Optional
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow instructions
```

### 7. Verify
```bash
./scripts/health-check.sh --verbose
curl https://lms.gagneet.com/api/health
```

## Regular Deployment (Updates)

### Single Command Deployment
```bash
./scripts/build-and-deploy.sh
```

That's it! The script handles everything automatically.

### Deployment Options
```bash
# Skip backup (faster, but risky)
./scripts/build-and-deploy.sh --skip-backup

# Skip dependencies (if no package changes)
./scripts/build-and-deploy.sh --skip-deps

# Skip migrations (if no schema changes)
./scripts/build-and-deploy.sh --skip-migrations
```

## Rollback

### List Backups
```bash
./scripts/rollback.sh
```

### Rollback to Latest
```bash
./scripts/rollback.sh latest
```

### Rollback to Specific Backup
```bash
./scripts/rollback.sh backup-20260210-120000
```

## Health Monitoring

### Quick Check
```bash
./scripts/health-check.sh
```

### Detailed Check
```bash
./scripts/health-check.sh --verbose
```

### Public URL Check
```bash
./scripts/health-check.sh --url https://lms.gagneet.com/api/health
```

## Common PM2 Commands

```bash
pm2 status                  # View status
pm2 logs lms-nextjs         # View logs
pm2 monit                   # Monitor real-time
pm2 restart lms-nextjs      # Restart app
pm2 stop lms-nextjs         # Stop app
pm2 describe lms-nextjs     # Detailed info
```

## Common Issues

### App Won't Start
```bash
pm2 logs lms-nextjs --err --lines 50
npm run build
pm2 restart lms-nextjs
```

### Health Check Fails
```bash
pm2 status lms-nextjs
./scripts/health-check.sh --verbose
pm2 restart lms-nextjs
```

### Cannot Access Website
```bash
sudo systemctl status nginx
sudo systemctl status cloudflared
sudo nginx -t
sudo systemctl restart nginx
```

## Emergency Contacts

- **PM2 Logs**: `pm2 logs lms-nextjs`
- **Nginx Logs**: `sudo tail -50 /var/log/nginx/lms_error.log`
- **CloudFlare Logs**: `sudo journalctl -u cloudflared -n 50`

## Documentation

- **Full Guide**: [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md)
- **Troubleshooting**: See "Troubleshooting" section in full guide
- **Security**: See "Security Considerations" section in full guide

---

**Quick Support Checklist:**
1. Check PM2 status: `pm2 status lms-nextjs`
2. Check health: `./scripts/health-check.sh --verbose`
3. Check logs: `pm2 logs lms-nextjs --lines 50`
4. If needed, rollback: `./scripts/rollback.sh latest`
