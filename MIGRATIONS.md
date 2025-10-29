# Database Migrations Guide

This document explains how database migrations work in the DOU Jobs Scraper project.

## 🎯 Automatic Migrations (Production)

**Good news:** Migrations happen automatically on every deployment!

### How It Works

When you deploy to production (via Coolify):

1. Coolify pulls your latest code from GitHub
2. Docker Compose starts the services in this order:
   - ✅ `postgres` starts and becomes healthy
   - ✅ `migrate` runs `prisma db push` (applies schema changes)
   - ✅ `bot` starts only after migrations complete successfully

### What This Means

- **No manual commands needed** - migrations run automatically
- **Safe deployments** - bot won't start with outdated schema
- **Always up-to-date** - database schema matches your code
- **Path-independent** - works regardless of where Coolify stores your project

## 📋 Docker Compose Configuration

The magic happens in `docker/prod/docker-compose.yml`:

```yaml
services:
  migrate:
    build:
      dockerfile: docker/prod/Dockerfile.migrate
    restart: "no"  # Run once and exit
    depends_on:
      postgres:
        condition: service_healthy

  bot:
    depends_on:
      migrate:
        condition: service_completed_successfully  # Wait for migrations
```

## 🛠 Manual Migration Commands

### Production

If you ever need to run migrations manually:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to project (Coolify typically uses /data/coolify/applications/YOUR_APP_ID)
cd /data/coolify/applications/YOUR_APP_ID

# Run migrations
docker compose run --rm migrate

# Or view migration logs
docker compose logs migrate
```

### Development

For local development:

```bash
cd docker/dev
docker compose run --rm bot npm run -w @repo/database db:push
```

## 📝 Migration Files

### Dockerfile.migrate

Located at `docker/prod/Dockerfile.migrate`:

- Minimal Node.js Alpine image
- Installs only what's needed for Prisma
- Runs `npm run db:push` by default

### Prisma Schema

The schema is located at `packages/database/prisma/schema.prisma`

When you change the schema:
1. Test locally first
2. Commit and push to GitHub
3. Coolify automatically deploys and runs migrations
4. Done! 🎉

## 🔍 Checking Migration Status

### View Migration Logs

```bash
# View recent migration logs
docker compose logs migrate

# Follow migration logs in real-time
docker compose logs -f migrate
```

### Check Database Schema

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d dou_jobs

# List all tables
\dt

# Describe a specific table
\d jobs

# Exit
\q
```

## 🧪 Testing Migrations Locally

Before deploying, test your migration locally:

```bash
# 1. Update your schema in packages/database/prisma/schema.prisma

# 2. Build and run locally
cd docker/prod
docker compose build migrate
docker compose run --rm migrate

# 3. Check if it worked
docker compose exec postgres psql -U postgres -d dou_jobs
```

## 🚨 Troubleshooting

### Migration Failed (Exit Code 1)

If you see `service "migrate" didn't complete successfully: exit 1`, the migration failed and bot won't start.

**Step 1: Check logs in Coolify**

In Coolify UI:
1. Go to your application
2. Click on "Logs" tab
3. Look for errors from the `migrate` service

**Step 2: Common issues and fixes**

1. **Database connection error**
   - **Symptom**: `Can't reach database server`
   - **Fix**: Check `DATABASE_URL` in Coolify environment variables
   - **Verify**: Ensure postgres service is running and healthy

2. **Schema syntax error**
   - **Symptom**: `Error validating model` or `Prisma schema parsing failed`
   - **Fix**: Review your `packages/database/prisma/schema.prisma`
   - **Test locally first!**

3. **Missing dependencies**
   - **Symptom**: `prisma: command not found` or similar
   - **Fix**: Already handled in Dockerfile.migrate (installs all deps including devDependencies)

4. **Prisma Client generation failed**
   - **Symptom**: `@prisma/client did not initialize yet`
   - **Fix**: Check that `npm run -w @repo/database generate` runs successfully during build

**Step 3: Debug manually**

SSH into your VPS and run migration manually to see detailed output:

```bash
# SSH into VPS
ssh user@your-vps-ip

# Find your project path
docker ps | grep dou-jobs

# Navigate to project
cd /data/coolify/applications/YOUR_APP_ID

# Run migration with verbose output
docker compose run --rm migrate

# Or connect to postgres directly to check
docker compose exec postgres psql -U postgres -d dou_jobs
```

**Step 4: Check environment variables**

Make sure these are set in Coolify:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/dou_jobs?schema=public
POSTGRES_PASSWORD=same_password_as_in_database_url
```

⚠️ **Important**: The hostname in `DATABASE_URL` must be `postgres` (the service name), not `localhost`!

### Rollback Strategy

If deployment fails due to migration issues:

1. **Quick fix**: Revert your code changes
   ```bash
   git revert HEAD
   git push
   ```
   Coolify will auto-deploy the previous version

2. **Manual fix**: Fix the schema and redeploy
   ```bash
   # Fix schema.prisma
   git add packages/database/prisma/schema.prisma
   git commit -m "Fix migration issue"
   git push
   ```

## 📚 Additional Resources

- [Coolify Troubleshooting Guide](COOLIFY_TROUBLESHOOTING.md) - Quick fixes for Coolify deployment issues
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma DB Push](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [Docker Compose depends_on](https://docs.docker.com/compose/compose-file/compose-file-v3/#depends_on)

## 🔐 Best Practices

1. **Test locally first** - Always test schema changes in development
2. **Small changes** - Make incremental schema changes
3. **Backup before major changes** - Create database backup before significant migrations
4. **Monitor logs** - Check migration logs after deployment
5. **Use db:push for development** - Quick and easy for prototyping
6. **Consider migrate for production** - For complex changes or team environments

## 💡 Why db:push Instead of migrate?

We use `prisma db push` instead of `prisma migrate` because:

- ✅ **Simpler** - No migration files to manage
- ✅ **Faster** - Direct schema sync
- ✅ **Perfect for small teams/solo projects**
- ✅ **Works great with Prisma's schema-first approach

For larger teams or complex migrations, consider switching to `prisma migrate`.

---

**Questions?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

