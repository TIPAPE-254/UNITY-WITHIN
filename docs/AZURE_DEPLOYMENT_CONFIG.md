# Azure Web App Deployment Configuration

## 📋 Application Details

- **App Name**: `unitywithin-app`
- **Resource Group**: `unitywithin`
- **Platform**: Azure App Service (Node.js)
- **Runtime**: Node.js 20+

## 🔧 GitHub Actions Secrets Configuration

The following secrets must be configured in GitHub Repository Settings → Secrets:

### Required Secrets
| Secret Name | Value | Description |
|---|---|---|
| `AZURE_WEBAPP_NAME` | `unitywithin-app` | Azure App Service name |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | (from Azure Portal) | Publish profile for deployment authentication |

### Optional Secrets (if using Azure CLI for additional deployments)
| Secret Name | Value | Description |
|---|---|---|
| `AZURE_CREDENTIALS` | JSON (if using Azure Login action) | Service Principal credentials |
| `AZURE_SUBSCRIPTION_ID` | (from Azure Portal) | Azure subscription ID |
| `AZURE_RESOURCE_GROUP` | `unitywithin` | Resource group name |

## 📌 Setting Up Azure Publish Profile

1. **Azure Portal** → Navigate to App Service → `unitywithin-app`
2. Click **Download publish profile** (top-right button)
3. Save the XML file
4. In GitHub: Settings → Secrets and variables → Actions
5. Create new secret `AZURE_WEBAPP_PUBLISH_PROFILE`
6. Paste the entire contents of the downloaded XML file

## 🚀 Deployment Trigger

The GitHub Actions workflow (`.github/workflows/azure-webapp-deploy.yml`) is triggered on:
- **Push to `main` branch**: Automatic deployment
- **Manual trigger**: Actions → "Deploy To Azure Web App" → Run workflow

## 📊 Deployment Workflow Steps

1. **Checkout code** from `main` branch
2. **Setup Node.js 20** with npm caching
3. **Install dependencies**: `npm ci`
4. **Build app**: `npm run build`
5. **Deploy to Azure**: Using `azure/webapps-deploy@v3` action
6. **Log deployment status** with timestamp, commit, branch info
7. **Send notifications** on success/failure

## ✅ Verification

After deployment, verify the app is running:

```bash
# Check app service status
az webapp show -g unitywithin -n unitywithin-app

# View recent logs
az webapp log tail -n unitywithin-app -g unitywithin

# Browse the app
https://unitywithin-app.azurewebsites.net
```

## 🔐 Environment Variables

Set these in Azure App Service → Configuration → Application settings:

```
NODE_ENV=production
VITE_API_BASE_URL=https://unitywithin-app.azurewebsites.net
GEMINI_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
DATABASE_URL=<connection-string>
REDIS_URL=<redis-connection-string>
CLERK_SECRET_KEY=<your-key>
```

## 📱 Git Branch Protection

Only `main` branch can deploy to production:
- GitHub: Settings → Branches → Add rule for `main`
- Require status checks before merging
- Require pull request reviews (recommended)

## 🐛 Troubleshooting

### Deploy fails with "Cannot find module"
- Check `npm ci` successfully installs all dependencies
- Verify `package-lock.json` is committed

### App crashes after deployment
- View logs: `az webapp log tail -n unitywithin-app -g unitywithin`
- Check environment variables are set correctly
- Verify Node.js version compatibility

### CSS/JS missing in deployed app
- Ensure `npm run build` completes without errors
- Check `dist/` folder contains all built assets
- Verify Tailwind CSS is properly configured (see unity-within-ai-config.md)

## 📅 Last Updated
April 14, 2026

## 📚 Related Documentation
- See `.github/workflows/azure-webapp-deploy.yml` for workflow details
- See repository root `.env` files for environment setup
- See `server/` directory for backend configuration
