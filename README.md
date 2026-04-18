# Unity Within 2.0 🌍💙

A world-class emotional support ecosystem for Kenyan youth. Safe. Anonymous. Supported by AI.

## 🌟 Mission
To provide every young person in Kenya with a safe, non-judgmental space to breathe, vent, and heal—regardless of their ability to pay.

## 🚀 Key Features (v2.0 Update)

### 🤖 AI Companion ("Buddie")
- **Powered by Gemini 2.0 Flash**: Fast, compassionate, and culturally aware interactions.
- **Safety First**: Detects self-harm/crisis intent and prioritizes safety over conversation.
- **Kenyan Persona**: Understands local context (School stress, Hustle, Sheng).

### 🛡️ Safety & Privacy
- **Crisis Shield**: Global floating button for immediate access to Red Cross (1199) and Befrienders Kenya.
- **AI Moderation**: Real-time filtering of chat messages to block toxicity and crisis triggers.
- **Privacy by Design**: Anonymous chat data is structurally anonymized in the API.

### 💬 Community & Tools
- **Anonymous Peer Support**: Specialized rooms for "The Hustle", "Exam Stress", and "Heartbreak".
- **Smart Journaling**: Voice-enabled journaling with AI Reflection requests.
- **Mood Tracking**: Visual history of emotional well-being using soft, calming data viz.

### ⚡ Performance
- **Lazy Loading**: Optimized for 2G/3G networks common in remote areas.
- **Offline Capable**: Core resources available with minimal data.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS (Lazy Loaded).
- **Backend**: Node.js, Express, Socket.io.
- **AI**: Google Gemini API (v2.0 Flash).
- **Database**: PostgreSQL.

## 🏃 Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Environment Setup**:
   - Create `.env.local` in root with:
     ```
     VITE_GEMINI_API_KEY=your_key_here
     ```
   - Create `.env` in `server/` with:
     ```
     GEMINI_API_KEY=your_key_here
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=UNITY_WITHIN
     ```

3. **Start Development Server**:
   ```bash
   # Terminal 1 (Frontend):
   npm run dev
   
   # Terminal 2 (Backend):
   cd server && npm run dev
   ```

## ☁️ Deploy to Azure

The app deploys as a single **Azure App Service** (Node.js backend serves the built React frontend).

Target environment:
- Subscription: `9a191aa8-44e3-4326-9989-08fcf1653ea2`
- Resource Group: `UNITYWITHIN_group`

### Prerequisites
- Azure subscription
- Azure App Service (Node.js 20 LTS, Linux)
- Azure Database for PostgreSQL Flexible Server

### One-time Azure setup

1. **Create resources** in Azure Portal (or Azure CLI):
   ```bash
   az group create --name unity-within-rg --location eastus
   az appservice plan create --name unity-within-plan --resource-group unity-within-rg --sku B1 --is-linux
   az webapp create --name unity-within --resource-group unity-within-rg --plan unity-within-plan --runtime "NODE:20-lts"
   az postgres flexible-server create --name unity-within-db --resource-group unity-within-rg --sku-name Standard_B1ms --admin-user adminuser --version 16
   ```

2. **Add App Settings** in Azure Portal → App Service → Configuration → Application settings:
   | Setting | Value |
   |---------|-------|
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `DB_HOST` | `<your-server>.postgres.database.azure.com` |
   | `DB_USER` | `adminuser@<your-server>` |
   | `DB_PASSWORD` | Your DB password |
   | `DB_NAME` | `UNITY_WITHIN` |
   | `DB_PORT` | `5432` |
   | `DB_SSL` | `true` |
   | `ALLOWED_ORIGINS` | *(Optional)* `https://<your-app>.azurewebsites.net` (comma-separated if multiple) |

3. **Configure GitHub Actions secrets** in GitHub → Settings → Secrets and variables:
   - `AZURE_WEBAPP_PUBLISH_PROFILE` — download from Azure Portal → App Service → Get publish profile
     - **or** `AZURE_CREDENTIALS` — JSON output from `az ad sp create-for-rbac ... --sdk-auth`
   - `VITE_GEMINI_API_KEY` — Gemini API key (used at build time)

4. **Set the repository variable** in GitHub → Settings → Variables:
   - No variable required (workflow targets App Service name `unity-within` in `UNITYWITHIN_group`)

5. Push to the `master` or `main` branch — GitHub Actions (`.github/workflows/azure-deploy.yml`) will build and deploy automatically.

---
*Built with ❤️ for mental wellness.*
