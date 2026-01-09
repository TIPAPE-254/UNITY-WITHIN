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
- **Database**: MySQL.

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

---
*Built with ❤️ for mental wellness.*
