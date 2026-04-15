# Azure App Service PostgreSQL Deployment Guide

**Last Updated:** April 14, 2026  
**Status:** ✅ Production Ready  
**Database:** PostgreSQL (Azure Database for PostgreSQL)

---

## Quick Start - 5 Steps to Deploy

### Step 1: Create Azure PostgreSQL Database
```bash
# Azure Portal → Create Resource → Database for PostgreSQL - Single Server

Configuration:
- Server name: unity-within-db (or your choice)
- Admin username: azureuser
- Password: [Generate strong password, save securely]
- Version: PostgreSQL 13 or later
- Compute + Storage: Standard (B1s minimum for dev, D2s for production)
```

### Step 2: Create Azure App Service
```bash
# Azure Portal → Create Resource → App Service

Configuration:
- Name: unity-within-api (or your choice)
- Runtime: Node.js 18 LTS
- Region: Same as PostgreSQL for performance
```

### Step 3: Configure Environment Variables
**Azure Portal → App Service → Configuration → Application Settings**

Add these exact variables:

```
DB_HOST    = unity-within-db.postgres.database.azure.com
DB_USER    = azureuser@unity-within-db
DB_PASSWORD = [Your PostgreSQL password]
DB_NAME    = UNITY_WITHIN
DB_PORT    = 5432
DB_SSL     = true
NODE_ENV   = production
PORT       = 8080
```

**⚠️ IMPORTANT NOTES:**
- `DB_USER` must include `@server-name` suffix for Azure PostgreSQL
- `DB_SSL` must be `true` for Azure (required by Azure PostgreSQL)
- `PORT` should be 8080 (App Service default)
- Save configuration immediately

### Step 4: Configure PostgreSQL Firewall
**Azure Portal → PostgreSQL Server → Connection Security**

```
Firewall Rules:
- Allow Azure services and resources to access this server: ON
- Add your client IP (for local testing): [Your IP]
- Add App Service IP: Will be shown after App Service creation
```

### Step 5: Deploy Application

**Option A: Via Git (GitHub Actions)**
```bash
# Repository settings → Deployment → GitHub/Azure integration
# Push to main branch → Automatic deployment
```

**Option B: Via Azure CLI**
```bash
az webapp up --name unity-within-api --resource-group YOUR_RG --runtime "node|18"
```

**Option C: Via Zip Deploy**
```bash
# Build locally
npm run build

# Create deployment package
zip -r deploy.zip . -x "node_modules/*" ".git/*" "dist/*"

# Deploy
az webapp deployment source config-zip \
  --resource-group YOUR_RG \
  --name unity-within-api \
  --src-path deploy.zip
```

---

## Detailed Configuration

### Environment Variable Precedence
The application checks environment variables in this order:

```javascript
// server/db.js - readRuntimeEnv()
1. Direct env vars:        process.env.DB_HOST
2. Azure App Settings:     process.env.APPSETTING_DB_HOST
3. .env file defaults:     DB_HOST=localhost (dev only)
```

**Azure automatically converts:**
```
Application Setting: DB_HOST
↓ Azure Runtime converts to
Process env var:    APPSETTING_DB_HOST
↓ Our code reads
readRuntimeEnv('DB_HOST') → Gets APPSETTING_DB_HOST
```

### PostgreSQL Connection String (Reference Only)
```
Standard Azure Format:
postgresql://azureuser@unity-within-db:PASSWORD@unity-within-db.postgres.database.azure.com:5432/UNITY_WITHIN?sslmode=require

Our application uses individual env vars instead:
- DB_HOST = unity-within-db.postgres.database.azure.com
- DB_USER = azureuser@unity-within-db
- DB_PASSWORD = [your-password]
- DB_PORT = 5432
- DB_SSL = true
```

---

## Startup Sequence (What Happens on Deploy)

```
1. Azure App Service starts Node.js process
   ↓
2. server/server.js loads
   ↓
3. server/db.js initializes
   - Calls loadDatabaseEnv() → loads .env files if present
   - Calls readRuntimeEnv() → reads Azure App Settings
   - Creates PostgreSQL Pool with:
     * Host from APPSETTING_DB_HOST
     * User from APPSETTING_DB_USER
     * Password from APPSETTING_DB_PASSWORD
     * Database from APPSETTING_DB_NAME
     * Port 5432
     * SSL enabled
   ↓
4. server/server.js calls testConnection()
   - Tries: pool.query('SELECT 1')
   - Success: logs "✅ PostgreSQL Database connected successfully!"
   - Failure: logs error but continues (graceful degradation)
   ↓
5. server/server.js calls initializeDatabase()
   - Creates all required tables:
     * users
     * user_moods
     * chat_rooms
     * chat_messages
     * events
     * rsvps
     * therapists
     * support_sessions
     * [and more...]
   - Logs: "✅ [Table] table initialized"
   ↓
6. Express server listens on PORT (8080)
   - Ready to accept requests
   - Logs: "✅ Server running on port 8080"
```

### Monitoring Startup
**Azure Portal → App Service → Logs**

Expected output:
```
🐘 PostgreSQL Config: host=unity-within-db.postgres.database.azure.com user=azureuser@unity-within-db db=UNITY_WITHIN port=5432
✅ PostgreSQL Database connected successfully!
✅ User moods table initialized
✅ Chat rooms table initialized
✅ Chat messages table initialized
✅ User profiles table initialized
✅ Events table initialized
✅ RSVPs table initialized
✅ Therapists table initialized
✅ Support sessions table initialized
[... more tables ...]
✅ Server running on port 8080
```

If you see database connection error:
```
❌ Database connection failed: ...
❌ POSTGRESQL CONNECTION FAILED. Check these settings:
   1. Verify these environment variables are set:
      - DB_HOST: [shows value or ⚠️ NOT SET]
      - DB_USER: [shows value or ⚠️ NOT SET]
      - DB_PASSWORD: [shows ✅ Set or ⚠️ NOT SET]
      - DB_NAME: [shows value or ⚠️ NOT SET]
   2. Ensure PostgreSQL firewall allows App Service IP
   3. Check PostgreSQL is running and credentials are correct
```

---

## Verification Checklist

### Before Deployment
- [ ] PostgreSQL database created on Azure
- [ ] App Service created and configured
- [ ] All 6 environment variables set in App Settings
- [ ] PostgreSQL firewall allows App Service IP
- [ ] Local testing with actual PostgreSQL works:
   ```bash
   DB_HOST=localhost DB_USER=postgres npm run server
   ```

### After Deployment
- [ ] App Service deployment completes successfully
- [ ] Logs show: "✅ PostgreSQL Database connected successfully!"
- [ ] All tables initialized without errors
- [ ] Server listening on port 8080
- [ ] Health check endpoint responds:
   ```bash
   curl https://unity-within-api.azurewebsites.net/health
   # Expected: {"status":"ok","database":"connected"}
   ```

### API Endpoints to Test
```bash
# Test server is running
curl https://unity-within-api.azurewebsites.net/

# Test database connection
curl https://unity-within-api.azurewebsites.net/health

# Test authentication (replace with real credentials)
curl -X POST https://unity-within-api.azurewebsites.net/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Troubleshooting

### Issue: "Cannot connect to database"
```
Cause: Environment variables not set correctly
Fix:
1. Check App Service → Configuration → Application Settings
2. Verify DB_HOST includes full domain (.postgres.database.azure.com)
3. Verify DB_USER includes @servername suffix
4. Check PostgreSQL password is correct
5. Restart App Service after changing settings
```

### Issue: "firewall rules"
```
Cause: PostgreSQL firewall blocking App Service
Fix:
1. PostgreSQL Server → Connection security
2. Enable "Allow Azure services..."
3. Add App Service IP address manually
4. Wait 2-3 minutes for rules to apply
```

### Issue: "password authentication failed"
```
Cause: Credentials mismatch
Fix:
1. Verify credentials in Azure Portal
2. Check for special characters in password (may need escaping)
3. Ensure DB_PASSWORD exactly matches what you set
4. Try connecting locally first:
   psql -h unity-within-db.postgres.database.azure.com \
        -U azureuser@unity-within-db \
        -d UNITY_WITHIN
```

### Issue: "table already exists"
```
Cause: Normal - application trying to initialize existing tables
Fix: NOT AN ERROR - Expected behavior. Tables persist across deployments.
     The application safely handles existing tables with CREATE TABLE IF NOT EXISTS
```

---

## Production Best Practices

### 1. Security
- ✅ Use strong passwords (20+ chars, mixed case, numbers, symbols)
- ✅ Store passwords in Azure Key Vault, not in code
- ✅ Enable SSL (DB_SSL=true) - required
- ✅ Restrict firewall to specific IPs only
- ✅ Use managed identities where possible
- ✅ Never commit .env files or secrets

### 2. Performance
- ✅ Use D2s or larger compute tier
- ✅ Enable connection pooling (built into pg library)
- ✅ Monitor database CPU/memory in Azure Portal
- ✅ Set appropriate pool size: max: 10 (default)

### 3. Monitoring
```bash
# Check logs in real-time
az webapp log tail -n unity-within-api -g YOUR_RESOURCE_GROUP

# Monitor database metrics
# Azure Portal → PostgreSQL Server → Monitoring

# Set up alerts
# Azure Portal → App Service → Alerts
```

### 4. Backups
- ✅ Azure PostgreSQL automatic backups: 35 days retention
- ✅ Configure: PostgreSQL Server → Backup and restore
- ✅ Test restore procedures periodically

### 5. Scaling
- Start: B1s (1GB, single core)
- Monitor: Watch CPU/memory charts
- Scale up: D2s (2GB, 2 cores) if needed
- Scale down: Review costs monthly

---

## Environment Variables Reference

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `DB_HOST` | `unity-within-db.postgres.database.azure.com` | ✅ Yes | Full Azure domain, no port |
| `DB_USER` | `azureuser@unity-within-db` | ✅ Yes | Must include `@servername` |
| `DB_PASSWORD` | `SecurePass123!@#` | ✅ Yes | 20+ chars, strong password |
| `DB_NAME` | `UNITY_WITHIN` | ✅ Yes | Should match database name |
| `DB_PORT` | `5432` | ✅ Yes | Azure PostgreSQL standard |
| `DB_SSL` | `true` | ✅ Yes | Required for Azure |
| `NODE_ENV` | `production` | ⚠️ Optional | Enables optimization |
| `PORT` | `8080` | ⚠️ Optional | App Service default |

---

## GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Azure
        run: |
          npm install -g azure-cli
          az login --service-principal \
            -u ${{ secrets.AZURE_CLIENT_ID }} \
            -p ${{ secrets.AZURE_CLIENT_SECRET }} \
            --tenant ${{ secrets.AZURE_TENANT_ID }}
          az webapp up --name unity-within-api
```

---

## Support & Next Steps

1. **Deploy Application** using steps above
2. **Monitor Logs** via Azure Portal
3. **Test Endpoints** with provided curl commands
4. **Scale as Needed** based on usage metrics
5. **Enable HTTPS** (Azure App Service handles automatically)
6. **Configure Custom Domain** if desired

---

**Questions?** Check server/db.js for implementation details, or email your DevOps team.

Last Updated: April 14, 2026
