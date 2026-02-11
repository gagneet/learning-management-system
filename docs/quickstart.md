# LMS Production Deployment - Quick Reference

**STATUS**: DEPLOYED AND RUNNING

## Check Status

```bash
pm2 status lms-nextjs
pm2 monit
curl http://localhost:3001/api/health
```

## View Logs

```bash
pm2 logs lms-nextjs
pm2 logs lms-nextjs --err
tail -f logs/pm2-out.log
```

## Restart App

```bash
pm2 restart lms-nextjs
```

## Deploy Updates

```bash
git pull origin master
./scripts/build-and-deploy.sh
```

## Rollback

```bash
./scripts/rollback.sh
./scripts/rollback.sh latest
```

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@lms.com | admin123 |
| Center Admin | centeradmin@lms.com | admin123 |
| Teacher | teacher@lms.com | teacher123 |
| Student | student@lms.com | student123 |

## Enable Public Access

```bash
sudo ./scripts/configure-cloudflare-tunnel.sh
```

Then configure DNS in CloudFlare Dashboard:
- Add CNAME: `lms` -> `<tunnel-id>.cfargotunnel.com`

## Documentation

| Document | Description |
|----------|-------------|
| [Production Deployment](deployment-production.md) | Complete deployment guide |
| [Quick Start](deployment-quickstart.md) | Quick setup reference |
| [Deployment Status](deployment-status.md) | Current production status |
| [Troubleshooting](troubleshooting.md) | Common issues and solutions |
