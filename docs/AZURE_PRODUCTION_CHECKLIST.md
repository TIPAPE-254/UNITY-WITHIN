# Azure Production Deployment Checklist

**Application:** UNITY WITHIN  
**Database:** Azure Database for PostgreSQL  
**Platform:** Azure App Service  
**Last Updated:** April 14, 2026

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Local Testing
- [ ] Clone repository locally
- [ ] Run `npm install` to install all dependencies
- [ ] Verify PostgreSQL is installed locally
- [ ] Create local `.env.local` file with test credentials
- [ ] Test: `npm run dev:all` starts without errors
- [ ] Test API endpoint: `curl http://localhost:5000`
- [ ] Test database connection works
- [ ] Verify all tables create successfully
- [ ] Check logs for: "✅ PostgreSQL Database connected successfully!"

### 2. Code Verification
- [ ] No database drivers other than 'pg' (PostgreSQL) in use
- [ ] All SQL queries use PostgreSQL syntax (no MySQL-specific functions)
- [ ] All placeholder queries use native PostgreSQL $1, $2, ... format
- [ ] Environment variables properly read via `readRuntimeEnv()`
- [ ] `.env` files are in `.gitignore` (never commit secrets)
- [ ] No hardcoded database connections
- [ ] No hardcoded API endpoints (using API_BASE_URL constant)
- [ ] Health check endpoint `/api/health` responds properly

### 3. Git & Repository
- [ ] All changes committed
- [ ] Nothing in `.env` or `.env.local` committed
- [ ] Repository is clean: `git status` shows no uncommitted changes
- [ ] Latest code pushed to `main` branch
- [ ] Verify commit message includes database changes

### 4. Azure Resources Created
- [ ] Azure Resource Group exists
- [ ] Azure Database for PostgreSQL created
- [ ] Azure App Service created (Node.js 18 LTS)
- [ ] PostgreSQL server name noted (e.g., `unity-within-db`)
- [ ] PostgreSQL admin credentials saved securely
- [ ] PostgreSQL database name created (UNITY_WITHIN)

---

## 🔐 AZURE CONFIGURATION CHECKLIST

### 5. PostgreSQL Server Setup
- [ ] PostgreSQL version: 13 or later
- [ ] Compute tier: At least B1s (for dev), D2s (for production)
- [ ] Backup retention: 35 days (default)
- [ ] SSL enforcement: ENABLED
- [ ] Connection timeout: 120 seconds
- [ ] Idle timeout: 300 seconds

### 6. PostgreSQL Firewall Rules
- [ ] "Allow Azure services..." = ON
- [ ] App Service IP address whitelisted (or will add after creation)
- [ ] Your client IP whitelisted (for troubleshooting)
- [ ] No overly permissive rules (never use 0.0.0.0/0)

### 7. PostgreSQL Database
- [ ] Database name: `UNITY_WITHIN` (exact case)
- [ ] Admin user can connect locally
- [ ] Database is empty (initial tables create via application)

### 8. App Service Configuration
- [ ] App Service name: `unity-within-api` (or your choice)
- [ ] Runtime: Node.js 18 LTS
- [ ] Region: Same as PostgreSQL (for performance)
- [ ] Tier: At least B1 (free tier for testing, paid for production)
- [ ] Always On: Enabled (prevents cold starts)
- [ ] HTTPS Only: Enabled

### 9. Environment Variables in App Service
**Navigate to: App Service → Configuration → Application Settings**

Add exactly these variables (copy-paste the names):

```
DB_HOST = unity-within-db.postgres.database.azure.com
DB_USER = azureuser@unity-within-db
DB_PASSWORD = [Your PostgreSQL password]
DB_NAME = UNITY_WITHIN
DB_PORT = 5432
DB_SSL = true
NODE_ENV = production
PORT = 8080
```

After adding all 8 variables:
- [ ] Click "Save" button at the top
- [ ] Wait for notification: "Update successful"
- [ ] Verify all 8 appear in the list

### 10. Key Vault Integration (Optional but Recommended)
Instead of storing passwords in App Settings:
- [ ] Create Azure Key Vault
- [ ] Store DB_PASSWORD secret
- [ ] Reference in App Service: `@Microsoft.KeyVault(SecretUri=...)`

---

## 📦 DEPLOYMENT CHECKLIST

### 11. Code Deployment
Choose ONE of these methods:

**Option A: GitHub Actions (Recommended)**
- [ ] GitHub repository connected to Azure
- [ ] Main branch auto-deploys to App Service
- [ ] Deploy workflow runs on push to main
- [ ] Wait for workflow to complete
- [ ] Check deployment status in Azure Portal

**Option B: Local Deployment**
- [ ] Run: `npm install`
- [ ] Run: `npm run build` (if applicable)
- [ ] Run: `az webapp up --name unity-within-api --resource-group YOUR_RG`
- [ ] Wait for deployment to complete

**Option C: Zip Deploy**
- [ ] Run: `zip -r deploy.zip . -x "node_modules/*" ".git/*"`
- [ ] Run: `az webapp deployment source config-zip -n unity-within-api -g YOUR_RG --src-path deploy.zip`
- [ ] Wait for deployment to complete

### 12. Verify Deployment
- [ ] Azure Portal shows "Deployment succeeded"
- [ ] App Service status = "Running"
- [ ] No error notifications

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 13. Check Application Logs
**Azure Portal → App Service → Logs**

Look for these messages (in order):
```
🐘 PostgreSQL Config: host=unity-within-db.postgres.database.azure.com ...
✅ PostgreSQL Database connected successfully!
✅ User moods table initialized
✅ Chat rooms table initialized
✅ Chat messages table initialized
... (more table initializations)
✅ Server running on port 8080
✅ Application ready
```

### 14. Test Health Check
```bash
curl https://unity-within-api.azurewebsites.net/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-04-14T12:34:56.789Z",
  "uptime": 45.2,
  "environment": "production"
}
```

If you see `"database": "disconnected"`:
- [ ] Check PostgreSQL firewall rules
- [ ] Verify App Service IP is whitelisted
- [ ] Check environment variables are correct
- [ ] Restart App Service

### 15. Test API Endpoints
```bash
# Test server is running
curl https://unity-within-api.azurewebsites.net/

# Test health endpoint
curl https://unity-within-api.azurewebsites.net/api/health

# Test authentication (adjust with real test user)
curl -X POST https://unity-within-api.azurewebsites.net/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!"}'
```

### 16. Verify Database Tables
Connect to PostgreSQL using Azure Portal query editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;
```

Should see tables:
- users
- user_moods
- chat_rooms
- chat_messages
- events
- rsvps
- therapists
- support_sessions
- support_notifications
- And more...

### 17. Check Application Metrics
**Azure Portal → App Service → Metrics**

- [ ] CPU Usage: Should be < 50%
- [ ] Memory Usage: Should be < 60%
- [ ] Response Time: Should be < 200ms
- [ ] 4xx Errors: Should be minimal
- [ ] 5xx Errors: Should be 0

### 18. Monitor Logs Continuously
```bash
# Stream logs in real-time
az webapp log tail -n unity-within-api -g YOUR_RESOURCE_GROUP

# Look for any errors prefixed with ❌
# Look for connection issues
# Watch response times
```

---

## 🚨 TROUBLESHOOTING

### Issue: "PostgreSQL connection failed"
**Diagnosis:**
```
Check logs for: "❌ Database connection failed"
```

**Solutions:**
1. [ ] Verify all 6 DB variables are in App Settings (not lowercase)
2. [ ] Verify DB_USER includes `@servername` suffix
3. [ ] Test PostgreSQL firewall: Add your IP, test with psql
4. [ ] Restart App Service after changing settings
5. [ ] Check PostgreSQL server status (might be paused)

### Issue: "Tables not created / table already exists"
**Diagnosis:**
```
First deployment: Tables should create automatically
Subsequent deployments: "table already exists" is OK
```

**Solutions:**
1. [ ] First deployment: Wait 30 seconds for initialization
2. [ ] Check logs show "✅ [TableName] table initialized"
3. [ ] If stuck: Check PostgreSQL database exists and is accessible

### Issue: "Connection timeout / connection refused"
**Diagnosis:**
```
Check logs for: "getaddrinfo ENOTFOUND / ECONNREFUSED"
```

**Solutions:**
1. [ ] Verify PostgreSQL server is running (not paused)
2. [ ] Verify firewall rule: "Allow Azure services": ON
3. [ ] Add App Service outbound IP to PostgreSQL firewall
4. [ ] Check PostgreSQL still has available connections
5. [ ] Increase connection timeout in db.js if needed

### Issue: "Request timeout / 502 Bad Gateway"
**Diagnosis:**
```
Slow database queries or connection pool exhausted
```

**Solutions:**
1. [ ] Check database metrics for slow queries
2. [ ] Scale up App Service (increase tier)
3. [ ] Increase connection pool size in db.js
4. [ ] Monitor concurrent requests

### Issue: "Environment variable not found"
**Diagnosis:**
```
Check logs for: "⚠️ NOT SET" in database config
```

**Solutions:**
1. [ ] Verify variable name exact match in App Settings
2. [ ] No typos: DB_HOST not db_host
3. [ ] Values should NOT include quotes
4. [ ] Restart App Service after adding variables

---

## 📊 SCALING GUIDELINES

### Start Small
- **Tier:** B1 (Free/Shared)
- **Compute:** 1 core, 1.75 GB RAM
- **PostgreSQL:** B1s (1 core, 1 GB RAM)
- **Cost:** ~$5-10/month

### Scale Up When
- CPU consistently > 70%
- Memory consistently > 75%
- Response times > 500ms
- More than 50 concurrent users

### Recommended Production Tier
- **Tier:** D2s (Standard or Premium)
- **Compute:** 2 cores, 7 GB RAM
- **PostgreSQL:** D2s (2 cores, 7 GB RAM)
- **Cost:** ~$50-100/month

### Auto-Scale Configuration
```
Scale out when:
- CPU > 80% for 5 minutes
- Add 1 instance (up to 5 max)

Scale in when:
- CPU < 25% for 10 minutes
- Remove 1 instance (keep minimum 2)
```

---

## 🔄 MAINTENANCE CHECKLIST

### Daily
- [ ] Monitor Azure Portal metrics
- [ ] Check application logs for errors
- [ ] Review health check endpoint

### Weekly
- [ ] Review database size growth
- [ ] Check error rate trends
- [ ] Verify backup completeness

### Monthly
- [ ] Review performance metrics
- [ ] Test disaster recovery (restore from backup)
- [ ] Check security logs for suspicious activity
- [ ] Review costs and optimize as needed

### Quarterly
- [ ] Update Node.js runtime (if new LTS available)
- [ ] Update PostgreSQL version (if major update available)
- [ ] Security audit of all configurations
- [ ] Capacity planning review

---

## 📞 SUPPORT & NEXT STEPS

1. **Deployment Issues?**
   - Check logs: App Service → Logs
   - Verify database: PostgreSQL → Connection strings
   - Test health: `/api/health` endpoint

2. **Performance Issues?**
   - Monitor: App Service → Metrics
   - Scale: App Service → Scale up
   - Optimize: Database indexes

3. **Security Audit?**
   - Review: All environment variables (never hardcoded)
   - Check: Firewall rules (least privilege)
   - Verify: HTTPS only (enabled)
   - Audit: Access logs

4. **Questions?**
   - Docs: `/docs/AZURE_POSTGRESQL_DEPLOYMENT.md`
   - Code: `/server/db.js` - database configuration
   - API: HTTP GET `/api/health` - health status

---

## ✨ SUCCESS CRITERIA

Your deployment is **SUCCESSFUL** when:

✅ Health check returns `"status": "healthy"`  
✅ Logs show "✅ PostgreSQL Database connected successfully!"  
✅ All tables created without errors  
✅ API endpoints respond within 200ms  
✅ No 5xx errors in metrics  
✅ Database metrics show < 50% utilization  
✅ Logs contain no error messages (❌)  
✅ Continuous deployments work (if using GitHub Actions)  

---

**Last Verified:** April 14, 2026  
**Next Review:** After first production week
