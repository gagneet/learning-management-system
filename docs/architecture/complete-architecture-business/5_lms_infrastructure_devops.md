# AetherLearn LMS — Doc 5: Infrastructure & DevOps

**Deployment, CI/CD, Monitoring, Security, and Infrastructure as Code**

Doc 5 of 6 · Links to: All modules — deployment and scaling strategy

---

## 1. Current Production Architecture

AetherLearn is deployed on a self-hosted Ubuntu server with the following production stack:

```
Internet → CloudFlare (SSL/CDN/DDoS) → CloudFlare Tunnel
  → Nginx (reverse proxy, rate limiting, static assets)
    → PM2 Cluster (Next.js 16 on port 3001, all CPU cores)
      → PostgreSQL (port 5432, local)
      → Redis (port 6379, local) [PROPOSED]
      → MinIO (port 9000, local) [PROPOSED]
```

### Current Infrastructure Components

| Component | Technology | Configuration |
|-----------|-----------|--------------|
| Runtime | Node.js 18+ | ES2017 target, strict TypeScript |
| Framework | Next.js 16 (App Router) | React 19, Server Components |
| Styling | Tailwind CSS v3.x | NOT v4 (incompatible with Next.js 16) |
| ORM | Prisma | Singleton client, db:push (transitioning to migrate) |
| Database | PostgreSQL 15+ | Local, port 5432 |
| Auth | NextAuth.js v5 | JWT strategy, credentials provider |
| Process Manager | PM2 | Cluster mode (max cores), port 3001 |
| Reverse Proxy | Nginx | Ports 80/443, rate limiting |
| SSL/CDN | CloudFlare | Origin certificate, tunnel, caching |
| Testing | Playwright | E2E tests across all roles |

### Deployment Scripts (Existing)

| Script | Purpose |
|--------|---------|
| `./scripts/build-and-deploy.sh` | Full deployment with backup, build, restart, health check, auto-rollback |
| `./scripts/rollback.sh` | Rollback to previous backup (interactive or `latest`) |
| `./scripts/health-check.sh` | Application health verification (local or public URL) |
| `./scripts/database-setup.sh` | Initial PostgreSQL setup |
| `./scripts/generate-env-production.sh` | Generate production .env file |
| `./scripts/configure-cloudflare-tunnel.sh` | CloudFlare tunnel configuration |

---

## 2. Infrastructure Additions — Redis and MinIO

### Redis Installation and Configuration

Redis is required for: BullMQ event bus, session caching, leaderboard sorted sets, rate limiting, and SSE pub/sub.

```bash
# Installation
sudo apt update && sudo apt install redis-server -y

# Configuration (/etc/redis/redis.conf)
bind 127.0.0.1          # Local only
port 6379
maxmemory 512mb          # Adjust based on server RAM
maxmemory-policy allkeys-lru
appendonly yes            # AOF persistence
appendfsync everysec
```

**PM2 cluster mode caveat:** Each PM2 worker is a separate process. In-memory state (Node.js Maps, caches) is NOT shared between workers. Redis provides the shared state layer.

### MinIO Installation (S3-Compatible File Storage)

MinIO provides durable storage for scanned documents, course materials, profile photos, and QR code images.

```bash
# Installation
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create data directory
sudo mkdir -p /data/minio
sudo chown -R $USER:$USER /data/minio

# Create systemd service
sudo tee /etc/systemd/system/minio.service << EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=$USER
Environment="MINIO_ROOT_USER=minio_admin"
Environment="MINIO_ROOT_PASSWORD=your_secure_password"
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable minio && sudo systemctl start minio
```

**Buckets to create:**
- `aetherlearn-documents` — Scanned worksheets, physical work uploads
- `aetherlearn-content` — Course materials, exercise assets
- `aetherlearn-avatars` — User profile images
- `aetherlearn-exports` — Generated reports, CSV exports

**Pre-signed URLs** for secure time-limited access (60 min default):

```typescript
// lib/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT, // http://localhost:9000
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

export async function getUploadUrl(bucket: string, key: string) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function getDownloadUrl(bucket: string, key: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
```

---

## 3. CI/CD Pipeline with GitHub Actions

### Pipeline Stages

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx vitest run --coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: lms_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx prisma db push
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/lms_test
      - run: npx vitest run --config vitest.integration.config.mts

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: lms_e2e
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx prisma db push && npm run db:seed
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/lms_e2e
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/learning-management-system
            git pull origin main
            ./scripts/build-and-deploy.sh
```

### Branch Strategy

- `main` — Production. Deploys automatically after all checks pass.
- `develop` — Integration branch. Runs full test suite, no deployment.
- `feature/*` — Feature branches. PR into develop.
- `hotfix/*` — Emergency fixes. PR directly into main.

---

## 4. Database Management

### Transition from db:push to Prisma Migrate

```bash
# Step 1: Create baseline migration from current schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_baseline/migration.sql

# Step 2: Mark as already applied
npx prisma migrate resolve --applied 0_baseline

# Step 3: Future changes use migrations
npx prisma migrate dev --name add_homework_assignments

# Step 4: Production deployment uses
npx prisma migrate deploy
```

### Backup Strategy

```bash
# Automated daily backups (cron job)
# /etc/cron.d/lms-backup
0 2 * * * /path/to/scripts/backup-database.sh

# backup-database.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
mkdir -p $BACKUP_DIR

pg_dump -U lms_user -h localhost lms_db \
  --format=custom \
  --compress=9 \
  > "$BACKUP_DIR/lms_${TIMESTAMP}.dump"

# Keep 30 days of daily backups
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# Weekly full backup to off-site (S3/MinIO)
if [ "$(date +%u)" = "7" ]; then
  mc cp "$BACKUP_DIR/lms_${TIMESTAMP}.dump" minio/aetherlearn-backups/weekly/
fi
```

### Restore Procedure

```bash
# Restore from backup
pg_restore -U lms_user -h localhost -d lms_db \
  --clean --if-exists \
  /backups/postgresql/lms_20260213_020000.dump

# Verify data integrity
npx prisma db pull  # Should match schema.prisma
```

---

## 5. Monitoring and Observability

### Application Monitoring Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Application logs | Pino → PM2 logs → Loki | Structured JSON logging |
| Error tracking | Sentry | Exception capture, stack traces, user context |
| Performance metrics | Prometheus + custom metrics | API response times, DB query duration |
| Infrastructure metrics | node-exporter + Prometheus | CPU, memory, disk, network |
| Dashboards | Grafana | Unified monitoring dashboards |
| Uptime monitoring | UptimeRobot (free) | External HTTP checks every 5 min |
| Alerting | Grafana Alerts → Email/Slack | Threshold-based alerts |

### Sentry Integration

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1,
});

// In API routes — capture errors with context
export function captureApiError(error: Error, context: {
  userId?: string;
  centreId?: string;
  route: string;
}) {
  Sentry.withScope((scope) => {
    scope.setUser({ id: context.userId });
    scope.setTag('centreId', context.centreId);
    scope.setTag('route', context.route);
    Sentry.captureException(error);
  });
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      minio: await checkMinIO(),
    },
  };

  const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok');
  return Response.json(checks, { status: allHealthy ? 200 : 503 });
}
```

### Key Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| API Error Rate | > 5% of requests in 5 min | CRITICAL | Page on-call |
| Response Time | P95 > 2s for 10 min | HIGH | Investigate queries |
| DB Connection Pool | > 80% utilised | HIGH | Scale pool or investigate leaks |
| Disk Space | > 85% used | MEDIUM | Archive old backups |
| PM2 Restarts | > 3 in 10 min | CRITICAL | Check application errors |
| Redis Memory | > 80% of maxmemory | MEDIUM | Review TTLs |

---

## 6. Security Architecture

### Defense in Depth Layers

```
Layer 1: CloudFlare — DDoS protection, WAF, bot management
Layer 2: Nginx — Rate limiting (20/min login, 100/min API), request size limits
Layer 3: Next.js Middleware — Auth check, CSRF validation, CORS
Layer 4: Application — RBAC (lib/rbac.ts), tenancy isolation (lib/tenancy.ts)
Layer 5: Database — Parameterised queries (Prisma), audit logging
Layer 6: Infrastructure — SSH key only, firewall (ufw), fail2ban
```

### Security Checklist

| Area | Implementation | Status |
|------|---------------|--------|
| Authentication | NextAuth.js v5 + bcrypt (10 rounds) | ✅ Implemented |
| Authorization | 72+ permissions, 7-tier RBAC | ✅ Implemented |
| Multi-tenancy | centreId from session only, never request body | ✅ Implemented |
| Audit logging | Immutable AuditEvent for all privileged actions | ✅ Implemented |
| Input validation | Zod schemas on all API routes | 🔲 In Progress |
| Rate limiting (Nginx) | Login 20/min, API 100/min | ✅ Implemented |
| Rate limiting (App) | User-aware, endpoint-specific | 🔲 Planned |
| CSRF protection | Server Actions built-in + API middleware | 🔲 Planned |
| Encryption at rest | PostgreSQL TDE | 🔲 Planned |
| Encryption in transit | CloudFlare SSL + internal TLS | ✅ Implemented |
| COPPA compliance | Parent consent flow for under-13 | 🔲 Planned |
| Secrets management | .env files (not committed) | ✅ Implemented |
| SSH hardening | Key-only auth, fail2ban | ✅ Implemented |
| Firewall | ufw: only 80, 443, SSH | ✅ Implemented |

---

## 7. Scaling Strategy

### Vertical Scaling (Current Path)

The modular monolith on PM2 cluster mode scales vertically well:
- PM2 automatically uses all CPU cores
- PostgreSQL handles 100+ concurrent connections with connection pooling
- Redis handles 100K+ operations/second
- Nginx serves static assets and handles SSL termination

**Target capacity:** 10,000 concurrent users, sub-300ms API P95

### Horizontal Scaling (Future — If Needed)

If vertical limits are reached:

**Option A: Docker + Load Balancer**
```
Load Balancer (Nginx/HAProxy)
├── Server 1: Next.js (PM2 cluster) + BullMQ workers
├── Server 2: Next.js (PM2 cluster) + BullMQ workers
└── Shared Services:
    ├── PostgreSQL (primary + read replica)
    ├── Redis (primary + replica)
    └── MinIO (distributed mode)
```

**Option B: Container Orchestration (Kubernetes)**
```yaml
# k8s deployment (simplified)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aetherlearn-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aetherlearn
  template:
    spec:
      containers:
        - name: api
          image: aetherlearn/api:latest
          resources:
            requests: { cpu: '500m', memory: '512Mi' }
            limits: { cpu: '2000m', memory: '2Gi' }
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: db-secrets, key: url }
```

### Performance Optimisation Priorities

1. **Database:** Composite indexes with centreId leading, partial indexes for hot queries, EXPLAIN ANALYZE on slow queries
2. **Caching:** Redis for leaderboards (sorted sets), dashboard data (60s TTL), session tokens
3. **Next.js:** React Server Components for initial renders, ISR for semi-static pages, code splitting per route
4. **Images:** Sharp for server-side image processing (thumbnails, compression), WebP format, lazy loading
5. **Queries:** Prisma `select` to fetch only needed columns, `take`/`skip` for pagination, batch operations for bulk updates

---

## 8. Environment Management

### Three Environments

| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| Development | localhost:3000 | lms_dev (local) | Feature development |
| Staging | staging.lms.gagneet.com | lms_staging | Pre-production testing |
| Production | lms.gagneet.com | lms_db | Live system |

### Environment Variables

```bash
# .env.production.template (committed)
DATABASE_URL="postgresql://user:password@localhost:5432/lms_db"
NEXTAUTH_URL="https://lms.gagneet.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_TRUST_HOST="true"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minio_admin"
MINIO_SECRET_KEY="your_secure_password"

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"
LOG_LEVEL="info"

# Feature Flags
FEATURE_GAMIFICATION="true"
FEATURE_VIDEO_SESSIONS="false"
FEATURE_QR_SCANNING="false"
```

---

## 9. Disaster Recovery Plan

| Scenario | RTO | RPO | Recovery Steps |
|----------|-----|-----|----------------|
| Application crash | 30 seconds | 0 | PM2 auto-restart with exponential backoff |
| Bad deployment | 5 minutes | 0 | `./scripts/rollback.sh latest` |
| Database corruption | 30 minutes | 24 hours | Restore from latest pg_dump backup |
| Server failure | 2 hours | 24 hours | Provision new server, restore from backups |
| Data centre outage | 4 hours | 24 hours | Spin up on backup cloud provider |

### Recovery Runbook

```bash
# 1. Application won't start
pm2 logs lms-nextjs --lines 100  # Check error logs
./scripts/rollback.sh latest     # Rollback to last known good

# 2. Database issues
pg_isready -h localhost           # Check if PostgreSQL is running
sudo systemctl restart postgresql # Restart if needed
./scripts/health-check.sh --verbose

# 3. Full server restore
# On new server:
git clone https://github.com/gagneet/learning-management-system.git
./scripts/database-setup.sh
pg_restore -U lms_user -d lms_db /backups/latest.dump
npm ci && npm run build
pm2 start ecosystem.config.cjs --env production
```
