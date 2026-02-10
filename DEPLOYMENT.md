# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-random-secret-key"
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open browser:**
   Navigate to `http://localhost:3000`

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Connect your repository to Vercel**

2. **Configure environment variables in Vercel:**
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`

3. **Deploy:**
   Vercel will automatically build and deploy your application

### Option 2: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS base
   
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run db:generate
   RUN npm run build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Build and run:**
   ```bash
   docker build -t lms-app .
   docker run -p 3000:3000 --env-file .env lms-app
   ```

### Option 3: Traditional Server

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Use a process manager like PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "lms" -- start
   pm2 save
   pm2 startup
   ```

## Database Migrations

When making schema changes:

1. **Update `prisma/schema.prisma`**

2. **Generate migration:**
   ```bash
   npx prisma migrate dev --name migration_name
   ```

3. **Apply migration in production:**
   ```bash
   npx prisma migrate deploy
   ```

## Post-Deployment

1. **Create initial Super Admin user** (if not using seed data):
   - Access database directly or use Prisma Studio
   - Create a user with role `SUPER_ADMIN`

2. **Configure your centers/tenants:**
   - Create centers through the admin interface or database

3. **Set up users:**
   - Super Admin can create Center Admins
   - Center Admins can create Teachers and Students

## Monitoring

- Use Vercel Analytics for deployment monitoring
- Set up error tracking (Sentry, etc.)
- Monitor database performance
- Set up logging for API endpoints

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS in production
- [ ] Configure CORS if needed
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Environment variables secured

## Troubleshooting

### Build Fails
- Ensure all environment variables are set
- Check Node.js version (18+)
- Clear `.next` directory and rebuild

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database server is running
- Ensure PostgreSQL version compatibility

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again
