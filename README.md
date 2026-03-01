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
       DB_USER=postgres
     DB_PASSWORD=
     DB_NAME=UNITY_WITHIN
       DB_PORT=5432
       DB_SSL=false

      # Local frontend URL (dev). In production set this to your HTTPS domain.
      RESET_PASSWORD_BASE_URL=http://localhost:5173
       BREVO_SMTP_HOST=smtp-relay.brevo.com
       BREVO_SMTP_PORT=587
       BREVO_SMTP_USER=no-reply@unitywithin.app
       BREVO_SMTP_PASS=your_brevo_smtp_password_or_api_key
     ```

3. **Start Development Server**:
   ```bash
   # Terminal 1 (Frontend):
   npm run dev
   
   # Terminal 2 (Backend):
   cd server && npm run dev
   ```

## 🧠 Make Buddie More Conversational with DailyDialog

You can calibrate Buddie for smoother, more human everyday conversation using the DailyDialog dataset.

1. **Install Python dependency**:
   ```bash
   pip install kagglehub[pandas-datasets]
   ```

2. **Generate examples for Buddie**:
   ```bash
   cd server
   npm run prepare:dailydialog
   ```

   This creates `server/data/dailydialog_examples.json`.

3. **Optional tuning in `server/.env`**:
   ```env
   BUDDIE_DIALOG_DATA_PATH=./data/dailydialog_examples.json
   BUDDIE_DIALOG_FEWSHOT_COUNT=4
   ```

4. **Restart backend server**:
   ```bash
   cd server && npm run dev
   ```

Notes:
- Crisis and safety rules still take priority over style examples.
- Examples are used for tone/pacing guidance, not copied verbatim.

## 🫶 Add Mental Health Counseling Conversations (Hugging Face)

You can also calibrate Buddie with the dataset you shared:
`Amod/mental_health_counseling_conversations`.

1. **Install Python dependencies**:
   ```bash
   pip install datasets kagglehub[pandas-datasets]
   ```

2. **Generate counseling examples**:
   ```bash
   cd server
   npm run prepare:counseling
   ```

3. **Ensure backend env includes**:
   ```env
   BUDDIE_DIALOG_DATA_PATH=./data/dailydialog_examples.json
   BUDDIE_COUNSELING_DATA_PATH=./data/mental_health_counseling_examples.json
   BUDDIE_DIALOG_FEWSHOT_COUNT=4
   ```

4. **Restart backend**:
   ```bash
   cd server && npm run dev
   ```

Runtime behavior:
- Buddie combines DailyDialog + counseling examples for response style calibration.
- Safety and crisis policies always override dataset style.

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
   az postgres flexible-server create --name unity-within-db --resource-group unity-within-rg --sku-name Standard_B1ms --admin-user adminuser
   ```

2. **Add App Settings** in Azure Portal → App Service → Configuration → Application settings:
   | Setting | Value |
   |---------|-------|
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `DB_HOST` | `<your-server>.postgres.database.azure.com` |
   | `DB_USER` | `adminuser` |
   | `DB_PASSWORD` | Your DB password |
   | `DB_NAME` | `UNITY_WITHIN` |
   | `DB_PORT` | `5432` |
   | `DB_SSL` | `true` |
   | `RESET_PASSWORD_BASE_URL` | `https://www.unitywithin.app` |
   | `BREVO_SMTP_USER` | Brevo SMTP login |
   | `BREVO_SMTP_PASS` | Brevo SMTP password/API key |
   | `ALLOWED_ORIGINS` | *(Optional)* `https://<your-app>.azurewebsites.net` (comma-separated if multiple) |

3. **Configure GitHub Actions secrets** in GitHub → Settings → Secrets and variables:
   - `AZURE_WEBAPP_PUBLISH_PROFILE` — download from Azure Portal → App Service → Get publish profile
     - **or** `AZURE_CREDENTIALS` — JSON output from `az ad sp create-for-rbac ... --sdk-auth`
   - `VITE_GEMINI_API_KEY` — Gemini API key (used at build time)
    - For automatic Azure app settings (when using `AZURE_CREDENTIALS`), also set:
       - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_SSL`
       - `RESET_PASSWORD_BASE_URL`
       - `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`
       - `GEMINI_API_KEY` (and any optional AI provider keys you use)

4. **Set the repository variable** in GitHub → Settings → Variables:
   - No variable required (workflow targets App Service name `unity-within` in `UNITYWITHIN_group`)

5. Push to the `master` or `main` branch — GitHub Actions (`.github/workflows/azure-deploy.yml`) will build and deploy automatically.

### Forgot Password (Azure Production Checklist)

1. **Users table must include reset columns**:
   ```sql
   ALTER TABLE users
   ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
   ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
   ```

2. **Set required App Settings** in Azure App Service:
   - `RESET_PASSWORD_BASE_URL=https://www.unitywithin.app`
   - `BREVO_SMTP_HOST=smtp-relay.brevo.com`
   - `BREVO_SMTP_PORT=587`
   - `BREVO_SMTP_USER=<your brevo smtp user>`
   - `BREVO_SMTP_PASS=<your brevo smtp pass/api key>`
   - `BREVO_FROM_EMAIL=<your from email>`
   - `BREVO_FROM_NAME=UnityWithin`
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT=5432`, `DB_SSL=true`

3. **Confirm production routes** (already in backend):
   - `POST /api/forgot-password`
   - `POST /api/reset-password/:token`

4. **Redeploy and restart** App Service after changing settings.

5. **Verify flow** from the live site:
   - Submit email in “Forgot password”
   - Open Brevo-delivered email
   - Open reset link and submit new password
   - Login with new password

---
*Built with ❤️ for mental wellness.*
