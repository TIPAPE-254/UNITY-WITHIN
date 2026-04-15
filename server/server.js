import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import pkg from "pg";
const { Pool } = pkg;

// Import from our database module
import {
  pool,
  testConnection,
  initializeDatabase,
  isDatabaseAvailable,
} from "./db.js";
import {
  sendResetEmail,
  sendVolunteerInvite,
  sendTherapistInvite,
  sendEmail,
} from "./brevoMailer.js";
import {
  detectEmotionWithKenyanLayer,
  getKenyanCrisisBridgeResponse,
} from "./sheng.js";
import {
  aiConfig,
  AI_UNREACHABLE_MESSAGE,
  getAiProviderStatus,
} from "./config.js";
import {
  buildClerkMiddleware,
  requireStrictClerkSession,
  syncClerkAppUser,
} from "./clerk.js";
import { setupWebRTCSignaling } from "./webrtcSignaling.js";
import { setupPushNotifications } from "./push.js";
import { decrypt } from "./encryption.js";

// Import AI libraries
import OpenAI from "openai";

// Import other required modules
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import crypto from "crypto";
import cron from "node-cron";

// ============================================
// FILE UPLOAD UTILITIES
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Convert base64 image data to a file and return the URL path
 * Handles data URLs like: data:image/jpeg;base64,/9j/4AAQ...
 */
function saveBase64Image(base64Data) {
  return new Promise((resolve, reject) => {
    if (!base64Data) {
      resolve(null);
      return;
    }

    try {
      // Extract the base64 data and mime type
      let base64String = base64Data;
      let mimeType = "image/jpeg";
      let extension = "jpg";

      if (base64Data.includes("data:")) {
        const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64String = matches[2];
        }

        // Determine file extension from mime type
        if (mimeType.includes("png")) {
          extension = "png";
        } else if (mimeType.includes("gif")) {
          extension = "gif";
        } else if (mimeType.includes("webp")) {
          extension = "webp";
        }
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString("hex");
      const filename = `event_${timestamp}_${randomStr}.${extension}`;
      const filepath = path.join(UPLOADS_DIR, filename);

      // Convert base64 to buffer and write to file
      const imageBuffer = Buffer.from(base64String, "base64");
      fs.writeFile(filepath, imageBuffer, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Return the URL path (relative to server root)
        const urlPath = `/uploads/${filename}`;
        resolve(urlPath);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if a string is a base64 data URL
 */
function isBase64DataUrl(str) {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("data:") && str.includes("base64,");
}

const isAzureAppService = Boolean(
  process.env.WEBSITE_INSTANCE_ID || process.env.WEBSITE_SITE_NAME,
);

if (process.env.NODE_ENV !== "production" && !isAzureAppService) {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = path.resolve(serverDir, "..");
  const envCandidates = [
    path.resolve(workspaceRoot, ".env.local"),
    path.resolve(workspaceRoot, ".env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "server/.env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(serverDir, ".env"),
  ];

  for (const envPath of envCandidates) {
    dotenv.config({ path: envPath, override: false });
  }
}

const logAiProviderStatus = () => {
  const status = getAiProviderStatus();
  console.log(
    "🤖 AI Provider Status (from runtime env / Azure App Settings):",
    status,
  );
};

// ============================================
// AI CONFIGURATION CONSTANTS
// ============================================
const GROQ_MODEL = aiConfig.groq.model;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const HF_EMOTION_MODEL = aiConfig.emotion.hfModel;

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || "30000", 10);
const AI_RETRIES = parseInt(process.env.AI_RETRIES || "1", 10);
const BUDDIE_MEMORY_WINDOW = parseInt(
  process.env.BUDDIE_MEMORY_WINDOW || "6",
  10,
);
const BUDDIE_MEMORY_MAX = parseInt(process.env.BUDDIE_MEMORY_MAX || "60", 10);

// Buddie configuration
const BUDDIE_DIALOG_DATA_PATH =
  process.env.BUDDIE_DIALOG_DATA_PATH || "./data/dailydialog_examples.json";
const BUDDIE_COUNSELING_DATA_PATH =
  process.env.BUDDIE_COUNSELING_DATA_PATH ||
  "./data/mental_health_counseling_examples.json";
const BUDDIE_LIVESIYAM_DATA_PATH =
  process.env.BUDDIE_LIVESIYAM_DATA_PATH || "./data/livesiyam_examples.json";
const BUDDIE_DIALOG_FEWSHOT_COUNT = parseInt(
  process.env.BUDDIE_DIALOG_FEWSHOT_COUNT || "2",
  10,
);
const BUDDIE_REPLY_MAX_TOKENS = parseInt(
  process.env.BUDDIE_REPLY_MAX_TOKENS || "85",
  10,
);
const BUDDIE_HF_DATASET = process.env.BUDDIE_HF_DATASET || "onyi666/mydataset2";
const BUDDIE_HF_CONFIG = process.env.BUDDIE_HF_CONFIG || "default";
const BUDDIE_HF_DATASETS = (
  process.env.BUDDIE_HF_DATASETS ||
  `${BUDDIE_HF_DATASET}:${BUDDIE_HF_CONFIG},facebook/empathetic_dialogues:default`
)
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const BUDDIE_HF_ROWS_LIMIT = Math.max(
  10,
  parseInt(process.env.BUDDIE_HF_ROWS_LIMIT || "120", 10),
);
const BUDDIE_EMPATHY_BANK_PATH =
  process.env.BUDDIE_EMPATHY_BANK_PATH || "./data/unityEmpathyBank.json";
const BUDDIE_EMPATHY_BANK_FALLBACK_PATHS = [
  BUDDIE_EMPATHY_BANK_PATH,
  "./data/unityEmpathyBank.json",
  "../unityEmpathyBank.json",
  "./unityEmpathyBank.json",
  "../../unityEmpathyBank.json",
  "/home/site/unityEmpathyBank.json",
  "/home/site/wwwroot/unityEmpathyBank.json",
];

const DEFAULT_BUDDIE_STYLE_EXAMPLES = [];

const BUDDIE_UNSAFE_STYLE_PATTERNS = [
  /kill myself|suicide|end my life|self\s*harm/i,
  /medical doctors suppress|natural doctors cure/i,
  /ignore medical|don't see a doctor|do not see a doctor/i,
  /sweet-talk.*counselors/i,
  /you might\s*:\)/i,
];

const SUPER_ADMIN_EMAIL = "lepiromatayo@gmail.com";

// System Instruction for Buddie AI
const SYSTEM_INSTRUCTION = `
You are BUDDIE, a casual, warm digital friend for Unity Within. You reply like you're texting a close friend—short, real, and human.

RESPONSE LENGTH: Keep replies to 1-2 sentences max. Examples of good BUDDIE replies:
- User: "Hello" → BUDDIE: "wassup 👋 how's it going?"
- User: "I'm stressed about exams" → BUDDIE: "oof, exams are rough. wanna talk it through?"
- User: "thanks for listening" → BUDDIE: "anytime, you got this 💪"

TONE
- Natural and casual. Use contractions, slang, emojis sparingly, real language.
- Warm but brief. Never preachy, clinical, or robotic.
- Match their energy: chill if they're chill, supportive if they're struggling.

WHAT TO DO
- Acknowledge their vibe in 1-2 simple words.
- Ask ONE short question max, or offer 1 small supportive thing.
- Vary openings (never repeat "How are you feeling?" etc).
- Use Kenyan warmth naturally (poa, pole pole) when it fits.
- Celebrate wins casually ("yo, nice!" not "congratulations!").

WHAT NOT TO DO
- Don't explain, don't list, don't therapy-speak.
- Never say "I understand", "I hear you", or repeat their words back.
- No filler: skip "Want to share more?" and similar.
- No emojis unless you'd actually use them texting a friend.
- No "my role is to..." or any meta talk.

CRISIS ONLY
If they mention self-harm/suicide: drop casual tone, respond with calm care, give Kenya numbers (+254 715 765 561, 1199, +254 722 178 177) and say reach out now.
`;

// Default chat rooms
const DEFAULT_CHAT_ROOMS = [
  ["General", "A space for open conversations", "public"],
  ["Vent Room", "Let it all out - we listen without judgment", "public"],
  ["Mental Health", "Discussions around mental wellness", "public"],
  ["Study & Productivity", "Tips and support for academic success", "public"],
  ["Crisis Support", "Immediate help for those in need", "support"],
];

// Production config validation
const isProduction = process.env.NODE_ENV === "production";
const PORT = Number(process.env.UNITY_SERVER_PORT || process.env.PORT || 5001);

const validateProductionConfig = () => {
  if (isProduction) {
    const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
    const missing = required.filter((k) => {
      const direct = process.env[k];
      const appSetting = process.env[`APPSETTING_${k}`];
      return (
        !(direct && String(direct).trim()) &&
        !(appSetting && String(appSetting).trim())
      );
    });
    if (missing.length) {
      console.warn(`⚠️ Missing production env vars: ${missing.join(", ")}`);
    }
  }
};

const app = express();
app.use(cors());
// Increase payload limit to 50MB to allow large image uploads as data URLs
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, _res, next) => {
  const hostHeader = String(
    req.headers["x-forwarded-host"] || req.headers.host || "",
  ).toLowerCase();
  const host = hostHeader.split(",")[0].trim().split(":")[0];
  req.appType = host.startsWith("events.") ? "events" : "main";
  next();
});

// Decrypt admin email if ENCRYPTED_ADMIN_EMAIL is set
if (!process.env.ADMIN_EMAIL && process.env.ENCRYPTED_ADMIN_EMAIL) {
  try {
    const decryptedAdminEmail = decrypt(process.env.ENCRYPTED_ADMIN_EMAIL);
    process.env.ADMIN_EMAIL = decryptedAdminEmail;
    console.log(
      "✅ Admin email decrypted and loaded from ENCRYPTED_ADMIN_EMAIL",
    );
  } catch (error) {
    console.error("❌ Failed to decrypt ENCRYPTED_ADMIN_EMAIL:", error.message);
    console.warn(
      "⚠️ Admin authentication will be disabled. Set ADMIN_EMAIL directly or provide valid ENCRYPTED_ADMIN_EMAIL + ENCRYPTION_KEY",
    );
  }
}

app.get("/api/health", async (req, res) => {
  try {
    const dbAvailable = await isDatabaseAvailable();
    res.status(dbAvailable ? 200 : 503).json({
      status: dbAvailable ? "healthy" : "degraded",
      database: dbAvailable ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

const readRuntimeSetting = (key) => {
  const directValue = process.env[key];
  if (directValue && String(directValue).trim()) {
    return { value: String(directValue), source: key };
  }

  const appSettingKey = `APPSETTING_${key}`;
  const appSettingValue = process.env[appSettingKey];
  if (appSettingValue && String(appSettingValue).trim()) {
    return { value: String(appSettingValue), source: appSettingKey };
  }

  return { value: "", source: "missing" };
};

const runtimeSettingStatus = (key) => {
  const { value, source } = readRuntimeSetting(key);
  return {
    configured: Boolean(value),
    source,
  };
};

app.get("/api/admin/integrations/health", requireAdmin, async (req, res) => {
  const brevoApi = runtimeSettingStatus("BREVO_API_KEY");
  const brevoSmtpUser = runtimeSettingStatus("BREVO_SMTP_USER");
  const brevoSmtpPass = runtimeSettingStatus("BREVO_SMTP_PASS");
  const brevoFromEmail = runtimeSettingStatus("BREVO_FROM_EMAIL");

  const vapidPublic = runtimeSettingStatus("VAPID_PUBLIC_KEY");
  const vapidPrivate = runtimeSettingStatus("VAPID_PRIVATE_KEY");

  const openai = runtimeSettingStatus("OPENAI_API_KEY");
  const groq = runtimeSettingStatus("GROQ_API_KEY");
  const huggingface = runtimeSettingStatus("HUGGINGFACE_API_KEY");

  const brevoConfigured =
    brevoApi.configured ||
    (brevoSmtpUser.configured && brevoSmtpPass.configured);
  const vapidConfigured = vapidPublic.configured && vapidPrivate.configured;
  const aiConfigured =
    openai.configured || groq.configured || huggingface.configured;

  res.json({
    success: true,
    overall: brevoConfigured && vapidConfigured,
    checks: {
      brevo: {
        configured: brevoConfigured,
        mode: brevoApi.configured
          ? "api-key"
          : brevoSmtpUser.configured && brevoSmtpPass.configured
            ? "smtp"
            : "missing",
        apiKey: brevoApi,
        smtpUser: brevoSmtpUser,
        smtpPass: brevoSmtpPass,
        fromEmail: brevoFromEmail,
      },
      vapid: {
        configured: vapidConfigured,
        publicKey: vapidPublic,
        privateKey: vapidPrivate,
      },
      aiProviders: {
        anyConfigured: aiConfigured,
        openai,
        groq,
        huggingface,
      },
    },
  });
});

app.post(
  "/api/admin/integrations/test-email",
  requireAdmin,
  async (req, res) => {
    const { to, subject, message } = req.body || {};

    const recipient = String(to || "").trim();
    const emailSubject =
      String(subject || "").trim() || "Unity Within Integration Test";
    const emailMessage =
      String(message || "").trim() ||
      "This is a Brevo integration test from Unity Within.";

    if (!recipient || !recipient.includes("@")) {
      return res.status(400).json({
        success: false,
        error: 'A valid recipient email is required in "to".',
      });
    }

    try {
      const html = `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="margin: 0 0 12px; color: #111827;">Unity Within Email Integration Test</h2>
                <p style="margin: 0 0 10px; color: #374151;">${emailMessage}</p>
                <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">Sent at: ${new Date().toISOString()}</p>
            </div>
        `;

      const result = await sendEmail(recipient, emailSubject, html);
      if (!result?.success) {
        return res.status(502).json({
          success: false,
          error: result?.error || "Brevo send failed",
          mock: Boolean(result?.mock),
        });
      }

      return res.json({
        success: true,
        delivered: true,
        messageId: result?.messageId || null,
        recipient,
      });
    } catch (error) {
      console.error("Brevo integration test email error:", error);
      return res
        .status(500)
        .json({ success: false, error: error.message || "Unexpected error" });
    }
  },
);

// Endpoint to check if current user is admin
// Frontend can call this to determine whether to show admin dashboard
app.get("/api/user/is-admin", (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = (req.headers["x-user-email"] || req.user?.email || "")
    .toString()
    .toLowerCase()
    .trim();

  const isAdmin = Boolean(
    (adminEmail && userEmail === adminEmail.toLowerCase()) ||
    userEmail === SUPER_ADMIN_EMAIL,
  );
  res.json({ isAdmin, hasAdminEmailConfigured: Boolean(adminEmail) });
});

const requireUnityUser = async (req, res, next) => {
  try {
    const candidateIds = [
      req.user?.id,
      req.body?.userId,
      req.query?.userId,
      req.params?.userId,
      req.headers["x-user-id"],
    ];

    let resolvedUserId = null;
    for (const candidate of candidateIds) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) {
        resolvedUserId = value;
        break;
      }
    }

    const emailCandidates = [
      req.user?.email,
      req.body?.email,
      req.query?.email,
      req.headers["x-user-email"],
    ];
    const resolvedEmail = emailCandidates
      .map((value) =>
        String(value || "")
          .trim()
          .toLowerCase(),
      )
      .find((value) => value.includes("@"));

    let userRows = [];
    if (resolvedUserId) {
      [userRows] = await pool.query(
        "SELECT id, name, email, display_name, profile_image, trusted, role, emergency_contact, auth_provider, clerk_user_id, email_verified FROM users WHERE id = ? LIMIT 1",
        [resolvedUserId],
      );
    } else if (resolvedEmail) {
      [userRows] = await pool.query(
        "SELECT id, name, email, display_name, profile_image, trusted, role, emergency_contact, auth_provider, clerk_user_id, email_verified FROM users WHERE email = ? LIMIT 1",
        [resolvedEmail],
      );
    }

    const row = userRows?.[0];
    if (!row) {
      return res.status(401).json({
        error: "Authentication required",
        message:
          "Unable to resolve user from database. Provide a valid user id.",
      });
    }

    req.user = {
      id: row.id,
      name: row.name,
      email: row.email,
      displayName: row.display_name || row.name,
      profileImage: row.profile_image || null,
      trusted: Boolean(row.trusted),
      role: row.email === SUPER_ADMIN_EMAIL ? "admin" : row.role || "user",
      emergencyContact: row.emergency_contact || null,
      authProvider: row.auth_provider || "local",
      clerkUserId: row.clerk_user_id || null,
      emailVerified: Boolean(row.email_verified),
    };

    return next();
  } catch (error) {
    console.error("Unable to resolve Unity user from Clerk session:", error);
    return res.status(500).json({
      error: "Profile resolution failed",
      message: "Unable to load your Unity Within profile.",
    });
  }
};

const socialClerkMiddleware = buildClerkMiddleware();

const UNITY_SHARED_AUTH_COOKIE = "uw_auth_user";
const UNITY_SHARED_AUTH_TTL_SECONDS = 60 * 60 * 24 * 30;

const parseCookies = (cookieHeader = "") => {
  const cookies = {};
  String(cookieHeader || "")
    .split(";")
    .forEach((chunk) => {
      const [rawKey, ...rawValue] = chunk.split("=");
      if (!rawKey) {
        return;
      }
      const key = rawKey.trim();
      if (!key) {
        return;
      }
      cookies[key] = decodeURIComponent(rawValue.join("=").trim());
    });
  return cookies;
};

const resolveSharedCookieDomain = (req) => {
  const hostHeader = String(
    req.headers["x-forwarded-host"] || req.headers.host || "",
  ).toLowerCase();
  const host = hostHeader.split(",")[0].trim().split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") {
    return "";
  }
  if (host === "unitywithin.app" || host.endsWith(".unitywithin.app")) {
    return ".unitywithin.app";
  }
  return "";
};

const createSharedAuthToken = (user) => {
  const secret = getEventsAuthSecret();
  if (!secret) {
    return "";
  }

  const payload = {
    userId: Number(user.id),
    role: String(user.role || "user"),
    email: String(user.email || "").toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + UNITY_SHARED_AUTH_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
};

const verifySharedAuthToken = (token) => {
  try {
    const secret = getEventsAuthSecret();
    if (
      !secret ||
      !token ||
      typeof token !== "string" ||
      !token.includes(".")
    ) {
      return null;
    }

    const [encodedPayload, providedSignature] = token.split(".");
    if (!encodedPayload || !providedSignature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(encodedPayload)
      .digest("base64url");
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      !payload?.userId ||
      !payload?.exp ||
      Number(payload.exp) < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

const setSharedUserCookie = (req, res, user) => {
  const token = createSharedAuthToken(user);
  if (!token) {
    return;
  }
  const domain = resolveSharedCookieDomain(req);
  const secure =
    req.secure ||
    String(req.headers["x-forwarded-proto"] || "")
      .toLowerCase()
      .includes("https");
  // Use SameSite=None for secure cookies (cross-domain SSO), else fallback to Lax
  const sameSite = secure ? "SameSite=None" : "SameSite=Lax";
  const cookie = [
    `${UNITY_SHARED_AUTH_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${UNITY_SHARED_AUTH_TTL_SECONDS}`,
    sameSite,
    "HttpOnly",
    secure ? "Secure" : "",
    domain ? `Domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
};

const clearSharedUserCookie = (req, res) => {
  const domain = resolveSharedCookieDomain(req);
  const secure =
    req.secure ||
    String(req.headers["x-forwarded-proto"] || "")
      .toLowerCase()
      .includes("https");
  const sameSite = secure ? "SameSite=None" : "SameSite=Lax";
  const cookie = [
    `${UNITY_SHARED_AUTH_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    sameSite,
    "HttpOnly",
    secure ? "Secure" : "",
    domain ? `Domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
};
const getEventsAuthSecret = () => {
  const explicitSecret =
    process.env.EVENTS_AUTH_SECRET || process.env.APPSETTING_EVENTS_AUTH_SECRET;
  if (explicitSecret && String(explicitSecret).trim()) {
    return String(explicitSecret).trim();
  }
  const clerkSecret =
    process.env.CLERK_SECRET_KEY || process.env.APPSETTING_CLERK_SECRET_KEY;
  return clerkSecret ? String(clerkSecret).trim() : "";
};

const toBase64Url = (value) => Buffer.from(value).toString("base64url");

const verifyEventsAuthTicket = (ticket) => {
  try {
    const secret = getEventsAuthSecret();
    if (
      !secret ||
      !ticket ||
      typeof ticket !== "string" ||
      !ticket.includes(".")
    ) {
      return null;
    }

    const [encodedPayload, providedSignature] = ticket.split(".");
    if (!encodedPayload || !providedSignature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(encodedPayload)
      .digest("base64url");
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      !payload?.userId ||
      !payload?.exp ||
      Number(payload.exp) < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const resolveUserFromEventsTicket = async (ticketPayload) => {
  const [rows] = await pool.query(
    "SELECT id, email, role, clerk_user_id FROM users WHERE id = ? LIMIT 1",
    [Number(ticketPayload.userId)],
  );

  const user = rows?.[0];
  if (!user) {
    return null;
  }

  if (
    ticketPayload.email &&
    String(user.email || "").toLowerCase() !==
      String(ticketPayload.email).toLowerCase()
  ) {
    return null;
  }

  if (
    ticketPayload.clerkUserId &&
    String(user.clerk_user_id || "") !== String(ticketPayload.clerkUserId)
  ) {
    return null;
  }

  return {
    id: Number(user.id),
    email: user.email,
    role: user.email === SUPER_ADMIN_EMAIL ? "admin" : user.role || "user",
    clerkUserId: user.clerk_user_id || null,
  };
};

const resolveEventsIdentity = async (req) => {
  // Try events auth ticket first (highest priority for redirected users)
  const ticketHeader = req.headers["x-events-auth-ticket"];
  const ticket = Array.isArray(ticketHeader) ? ticketHeader[0] : ticketHeader;
  const parsedTicket = verifyEventsAuthTicket(ticket);

  if (parsedTicket) {
    try {
      const resolvedUser = await resolveUserFromEventsTicket(parsedTicket);
      if (resolvedUser) {
        console.log(
          `[RSVP Auth] Identified via events ticket for user ${resolvedUser.email}`,
        );
        return resolvedUser;
      }
    } catch (error) {
      console.error("Events ticket identity resolution failed:", error.message);
    }
  }

  // Resolve from Unity identity headers
  try {
    const candidateUserId = Number(
      req.headers["x-user-id"] ||
        req.body?.userId ||
        req.query?.userId ||
        req.params?.userId ||
        0,
    );

    const candidateEmail = String(
      req.headers["x-user-email"] ||
        req.body?.email ||
        req.body?.redirectContext?.loggedInEmail ||
        req.body?.redirectContext?.linkedEmail ||
        req.query?.email ||
        "",
    )
      .trim()
      .toLowerCase();

    let userRows = [];
    if (candidateUserId > 0) {
      [userRows] = await pool.query(
        "SELECT id, email, role, clerk_user_id FROM users WHERE id = ? LIMIT 1",
        [candidateUserId],
      );
    } else if (candidateEmail.includes("@")) {
      [userRows] = await pool.query(
        "SELECT id, email, role, clerk_user_id FROM users WHERE email = ? LIMIT 1",
        [candidateEmail],
      );
    }

    if (userRows?.length) {
      console.log(
        `[RSVP Auth] Identified via Unity headers for user ${userRows[0].email}`,
      );
      return {
        id: userRows[0].id,
        email: userRows[0].email,
        role:
          userRows[0].email === SUPER_ADMIN_EMAIL
            ? "admin"
            : userRows[0].role || "user",
        clerkUserId: userRows[0].clerk_user_id || null,
      };
    }
  } catch (error) {
    console.error("Unity header auth validation failed:", error.message);
  }

  // Resolve from shared signed cookie
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const sharedToken = cookies[UNITY_SHARED_AUTH_COOKIE];
    const sharedPayload = verifySharedAuthToken(sharedToken);

    if (sharedPayload) {
      const [rows] = await pool.query(
        "SELECT id, email, role, clerk_user_id FROM users WHERE id = ? LIMIT 1",
        [Number(sharedPayload.userId)],
      );

      if (rows?.length) {
        console.log(
          `[RSVP Auth] Identified via shared cookie for user ${rows[0].email}`,
        );
        return {
          id: rows[0].id,
          email: rows[0].email,
          role:
            rows[0].email === SUPER_ADMIN_EMAIL
              ? "admin"
              : rows[0].role || "user",
          clerkUserId: rows[0].clerk_user_id || null,
        };
      }
    }
  } catch (error) {
    console.error("Shared cookie auth validation failed:", error.message);
  }

  return null;
};

const requireEventsRsvpIdentity = async (req, res, next) => {
  const identifiedUser = await resolveEventsIdentity(req);
  if (identifiedUser) {
    req.user = identifiedUser;
    return next();
  }

  console.log(
    "[RSVP Auth] Missing valid identity (ticket, headers, or cookie)",
  );
  return res.status(401).json({
    success: false,
    error: "Authentication required",
    message: "Please sign in from Unity Within and try again.",
  });
};

app.post(
  "/api/auth/clerk/sync",
  socialClerkMiddleware,
  requireStrictClerkSession,
  async (req, res) => {
    try {
      const user = await syncClerkAppUser(req.clerkAuth);

      return res.json({
        success: true,
        user,
        session: {
          userId: req.clerkAuth.userId,
          email: req.clerkAuth.emailAddress,
          sessionId: req.clerkAuth.sessionId,
        },
      });
    } catch (error) {
      console.error("Clerk sync failed:", error);
      return res.status(500).json({
        error: "Session sync failed",
        message: "Unable to map the Clerk user to a Unity Within profile.",
      });
    }
  },
);

// Debug endpoint for troubleshooting RSVP authentication
app.get("/api/debug/auth-status", async (req, res) => {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      headers: {
        "x-events-auth-ticket": req.headers["x-events-auth-ticket"]
          ? "Ticket present"
          : "No ticket",
        cookie: req.headers.cookie ? "Cookie present" : "No cookie",
      },
    };

    // Try to verify ticket
    const ticketHeader = req.headers["x-events-auth-ticket"];
    const ticket = Array.isArray(ticketHeader) ? ticketHeader[0] : ticketHeader;
    const parsedTicket = verifyEventsAuthTicket(ticket);

    if (parsedTicket) {
      debug.ticket = {
        userId: parsedTicket.userId,
        email: parsedTicket.email,
        message: "Ticket is valid",
      };
    } else {
      debug.ticket = { message: "Ticket is invalid or missing" };
    }

    return res.json({
      success: true,
      debug,
      recommendation: !parsedTicket
        ? "Please ensure you are logged in and passing Unity identity headers/cookie or events ticket."
        : "Authentication check passed",
    });
  } catch (error) {
    console.error("Debug auth endpoint error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/create-user-profile", requireUnityUser, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
    message: "User profile is ready.",
  });
});

app.get(
  "/api/safe-rooms/trusted-example",
  requireUnityUser,
  async (req, res) => {
    if (!req.user.trusted) {
      return res
        .status(403)
        .json({ error: "Access denied", message: "Trusted users only." });
    }

    return res.json({
      success: true,
      message: "Welcome to a trusted safe room.",
    });
  },
);

function getAppBaseUrl(req) {
  const protocol =
    req.secure || req.headers["x-forwarded-proto"] === "https"
      ? "https"
      : "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

function requireAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = (req.headers["x-user-email"] || req.user?.email || "")
    .toString()
    .toLowerCase()
    .trim();

  // Check super admin override first
  if (userEmail === SUPER_ADMIN_EMAIL) {
    return next();
  }

  if (!adminEmail) {
    console.error(
      "❌ ADMIN_EMAIL not configured. Set ADMIN_EMAIL or ENCRYPTED_ADMIN_EMAIL + ENCRYPTION_KEY env vars.",
    );
    return res.status(500).json({
      error: "Server configuration error",
      hint: "Admin email not configured",
    });
  }

  if (!userEmail) {
    console.warn(
      "⚠️ Admin access denied: no x-user-email header or req.user.email",
    );
    return res.status(403).json({
      error: "Admin access required",
      hint: "Missing user email in headers or session",
    });
  }

  if (userEmail === adminEmail.toLowerCase()) {
    return next();
  }

  console.warn(
    `⚠️ Admin access denied for ${userEmail} (expected ${adminEmail})`,
  );
  return res.status(403).json({
    error: "Admin access required",
  });
}

function requireAdminOrTherapist(req, res, next) {
  if (req.user?.role === "admin" || req.user?.role === "therapist") {
    return next();
  }

  // Role header fallback
  const role = req.headers["x-role"];
  if (role === "admin" || role === "therapist") {
    return next();
  }

  // Admin email check (encrypted)
  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = (req.headers["x-user-email"] || "")
    .toString()
    .toLowerCase()
    .trim();
  if (adminEmail && userEmail && userEmail === adminEmail.toLowerCase()) {
    return next();
  }

  const userRole = req.user?.role || req.headers["x-role"] || "unknown";
  console.log(
    `[EVENTS] Permission denied: User role is '${userRole}', requires admin or therapist`,
  );
  return res.status(403).json({
    error: "Permission denied",
    message:
      "Only admins and therapists can create events. Your role is: " + userRole,
  });
}

function isAdminRequest(req) {
  const role = req.headers["x-role"];
  if (role === "admin") return true;

  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = (req.headers["x-user-email"] || "")
    .toString()
    .toLowerCase()
    .trim();
  return Boolean(
    (adminEmail && userEmail === adminEmail.toLowerCase()) ||
    userEmail === SUPER_ADMIN_EMAIL,
  );
}

function isTherapistRequest(req) {
  return (
    (req.headers["x-role"] || "").toString().toLowerCase().trim() ===
    "therapist"
  );
}

const resolveTherapistIdFromHeaders = async (headers = {}) => {
  const therapistIdHeader = Number(headers["x-therapist-id"] || 0);
  if (therapistIdHeader) {
    const [rows] = await pool.query(
      "SELECT id FROM therapists WHERE id = ? LIMIT 1",
      [therapistIdHeader],
    );
    if (rows?.length) return Number(rows[0].id);
  }

  const userIdHeader = Number(headers["x-user-id"] || 0);
  if (userIdHeader) {
    const [rows] = await pool.query(
      "SELECT id FROM therapists WHERE user_id = ? LIMIT 1",
      [userIdHeader],
    );
    if (rows?.length) return Number(rows[0].id);
  }

  const emailHeader = (headers["x-user-email"] || "")
    .toString()
    .toLowerCase()
    .trim();
  if (emailHeader) {
    const [rows] = await pool.query(
      "SELECT id FROM therapists WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [emailHeader],
    );
    if (rows?.length) return Number(rows[0].id);
  }

  return 0;
};

// ============================================
// HTTP SERVER & SOCKET.IO SETUP
// ============================================

const httpServer = createServer(app);
const server = httpServer;
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST"],
  },
});

// Initialize WebRTC signaling for video/voice calls
setupWebRTCSignaling(io);

// Initialize push notifications
setupPushNotifications(app);

const therapistPresence = new Map();
const socketTherapistBindings = new Map();
const userPresence = new Map();
const socketUserBindings = new Map();

const getOnlineTherapistIds = () => {
  return Array.from(therapistPresence.entries())
    .filter(([, sockets]) => sockets && sockets.size > 0)
    .map(([therapistId]) => Number(therapistId));
};

const isTherapistOnline = (therapistId) => {
  if (!therapistId) return false;
  const sockets = therapistPresence.get(Number(therapistId));
  return Boolean(sockets && sockets.size > 0);
};

const emitTherapistPresenceChanged = (therapistId) => {
  io.emit("therapist_presence_changed", {
    therapistId: Number(therapistId),
    isOnline: isTherapistOnline(Number(therapistId)),
    onlineTherapistIds: getOnlineTherapistIds(),
  });
};

const markTherapistSocketOnline = (socketId, therapistId) => {
  const parsedId = Number(therapistId);
  if (!parsedId) return;

  if (!therapistPresence.has(parsedId)) {
    therapistPresence.set(parsedId, new Set());
  }

  therapistPresence.get(parsedId).add(socketId);
  socketTherapistBindings.set(socketId, parsedId);
  emitTherapistPresenceChanged(parsedId);
};

const markTherapistSocketOffline = (socketId) => {
  const therapistId = socketTherapistBindings.get(socketId);
  if (!therapistId) return;

  const sockets = therapistPresence.get(therapistId);
  if (sockets) {
    sockets.delete(socketId);
    if (!sockets.size) therapistPresence.delete(therapistId);
  }

  socketTherapistBindings.delete(socketId);
  emitTherapistPresenceChanged(therapistId);
};

const markUserSocketOnline = (socketId, userId) => {
  const parsedUserId = Number(userId);
  if (!parsedUserId) return;

  if (!userPresence.has(parsedUserId)) {
    userPresence.set(parsedUserId, new Set());
  }

  userPresence.get(parsedUserId).add(socketId);
  socketUserBindings.set(socketId, parsedUserId);
};

const markUserSocketOffline = (socketId) => {
  const userId = socketUserBindings.get(socketId);
  if (!userId) return;

  const sockets = userPresence.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (!sockets.size) userPresence.delete(userId);
  }

  socketUserBindings.delete(socketId);
};

const resolveNotificationTitle = (type, fallback = "Session update") => {
  if (type === "support_session_confirmed") return "Session confirmed";
  if (type === "support_session_reminder") return "Session reminder";
  if (type === "support_session_live") return "Session is starting";
  if (type === "support_session_started") return "Session in progress";
  if (type === "support_session_ended") return "Session ended";
  return fallback;
};

const persistSupportNotification = async ({
  userId,
  sessionId = null,
  type,
  title,
  message,
  payload = null,
  eventKey = null,
  channel = "in_app",
}) => {
  const parsedUserId = Number(userId);
  if (!parsedUserId || !type || !message) return null;

  try {
    if (eventKey) {
      const [existingRows] = await pool.query(
        "SELECT id FROM support_notifications WHERE user_id = ? AND event_key = ? LIMIT 1",
        [parsedUserId, String(eventKey)],
      );
      if (existingRows?.length) {
        return Number(existingRows[0].id);
      }
    }

    const [insertResult] = await pool.query(
      `INSERT INTO support_notifications (user_id, session_id, type, title, message, event_key, payload, channel, is_read)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsedUserId,
        sessionId ? Number(sessionId) : null,
        String(type),
        String(title || resolveNotificationTitle(type)),
        String(message),
        eventKey ? String(eventKey) : null,
        payload ? JSON.stringify(payload) : null,
        String(channel || "in_app"),
        false,
      ],
    );

    return insertResult?.insertId || null;
  } catch (error) {
    console.error("Persist support notification error:", error);
    return null;
  }
};

const emitNotificationToUser = async ({
  userId,
  sessionId = null,
  type,
  title,
  message,
  payload = null,
  eventKey = null,
  channel = "in_app",
}) => {
  const parsedUserId = Number(userId);
  if (!parsedUserId || !type || !message) return;

  const notificationId = await persistSupportNotification({
    userId: parsedUserId,
    sessionId,
    type,
    title,
    message,
    payload,
    eventKey,
    channel,
  });

  const sockets = userPresence.get(parsedUserId);
  if (!sockets || !sockets.size) return;

  const notificationPayload = {
    id: notificationId,
    userId: parsedUserId,
    sessionId: sessionId ? Number(sessionId) : null,
    type,
    title: title || resolveNotificationTitle(type),
    message,
    payload,
    channel,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  sockets.forEach((socketId) => {
    io.to(socketId).emit("notification", notificationPayload);
  });
};

const resolveNotificationUserId = (req) => {
  const fromQuery = Number(req.query?.userId || 0);
  if (fromQuery) return fromQuery;

  const fromBody = Number(req.body?.userId || 0);
  if (fromBody) return fromBody;

  const fromHeader = Number(req.headers["x-user-id"] || 0);
  if (fromHeader) return fromHeader;

  const fromReqUser = Number(req.user?.id || 0);
  if (fromReqUser) return fromReqUser;

  return 0;
};

const SESSION_PREJOIN_WINDOW_MINUTES = 5;
const SUPPORT_REMINDER_MINUTES = [30, 5];
const supportSessionReminderCache = new Map();

const normalizeSupportLifecycleStatus = (value, fallback = "new") => {
  const raw = (value || "").toString().trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "new" || raw === "queued" || raw === "pending") return "new";
  if (raw === "accepted" || raw === "confirmed") return "confirmed";
  if (raw === "live") return "live";
  if (raw === "rejected") return "rejected";
  if (
    raw === "in_progress" ||
    raw === "in-progress" ||
    raw === "started" ||
    raw === "active" ||
    raw === "ongoing"
  )
    return "in_progress";
  if (
    raw === "ended" ||
    raw === "closed" ||
    raw === "done" ||
    raw === "resolved" ||
    raw === "completed"
  )
    return "ended";
  return fallback;
};

const parseSessionStartAtMs = (session) => {
  const dateValue = (session?.scheduled_date || "").toString().trim();
  const timeValue = (session?.scheduled_time || "").toString().trim();

  if (dateValue && timeValue) {
    const normalizedTime =
      timeValue.length === 5 ? `${timeValue}:00` : timeValue;
    const parsed = new Date(`${dateValue}T${normalizedTime}`).getTime();
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const fallback = session?.start_time
    ? new Date(session.start_time).getTime()
    : NaN;
  return Number.isNaN(fallback) ? null : fallback;
};

const getJoinStateForSession = (session, nowMs = Date.now()) => {
  const startAtMs = parseSessionStartAtMs(session);
  const normalizedStatus = normalizeSupportLifecycleStatus(
    session?.status,
    "new",
  );

  if (!startAtMs) {
    return {
      joinEnabled:
        normalizedStatus === "live" || normalizedStatus === "in_progress",
      minutesToStart: null,
      startsAt: null,
      phase: normalizedStatus,
    };
  }

  const minutesToStart = Math.ceil((startAtMs - nowMs) / 60000);
  const joinEnabled =
    normalizedStatus === "live" ||
    normalizedStatus === "in_progress" ||
    minutesToStart <= SESSION_PREJOIN_WINDOW_MINUTES;

  let phase = normalizedStatus;
  if (normalizedStatus === "confirmed" && minutesToStart <= 0) {
    phase = "live";
  }

  return {
    joinEnabled,
    minutesToStart,
    startsAt: new Date(startAtMs).toISOString(),
    phase,
  };
};

const emitSupportSessionReminder = async (session, minutesLeft) => {
  const reminderKey = `${Number(session.id)}:${minutesLeft}`;
  if (supportSessionReminderCache.has(reminderKey)) return;

  supportSessionReminderCache.set(reminderKey, Date.now());

  io.emit("support_session_reminder", {
    sessionId: Number(session.id),
    therapistId: Number(session.therapist_id) || null,
    userId: Number(session.user_id) || null,
    callMode:
      String(session.call_mode || "voice").toLowerCase() === "video"
        ? "video"
        : "voice",
    minutesLeft,
    message: `Session starts in ${minutesLeft} minutes`,
  });

  await emitNotificationToUser({
    userId: Number(session.user_id) || null,
    sessionId: Number(session.id),
    type: "support_session_reminder",
    title: resolveNotificationTitle("support_session_reminder"),
    message: `Your session starts in ${minutesLeft} minutes`,
    payload: {
      therapistId: Number(session.therapist_id) || null,
      callMode:
        String(session.call_mode || "voice").toLowerCase() === "video"
          ? "video"
          : "voice",
      minutesLeft,
    },
    eventKey: `session:${Number(session.id)}:reminder:${minutesLeft}:user`,
  });

  await emitNotificationToUser({
    userId: Number(session.therapist_user_id || 0) || null,
    sessionId: Number(session.id),
    type: "support_session_reminder",
    title: resolveNotificationTitle("support_session_reminder"),
    message: `Session with ${session.user_name || "client"} starts in ${minutesLeft} minutes`,
    payload: {
      therapistId: Number(session.therapist_id) || null,
      callMode:
        String(session.call_mode || "voice").toLowerCase() === "video"
          ? "video"
          : "voice",
      minutesLeft,
    },
    eventKey: `session:${Number(session.id)}:reminder:${minutesLeft}:therapist`,
  });

  const therapistEmail = (session.therapist_email || "").toString().trim();
  const userEmail = (session.user_email || "").toString().trim();
  const dateText = (session.scheduled_date || "").toString();
  const timeText = (session.scheduled_time || "").toString();

  try {
    if (therapistEmail) {
      await sendBrevoEmail({
        toEmail: therapistEmail,
        subject: `Reminder: session starts in ${minutesLeft} minutes`,
        htmlContent: `<p>Hello ${session.therapist_name || "Therapist"},</p><p>Your session with ${session.user_name || "client"} starts in ${minutesLeft} minutes.</p><p><strong>${dateText} ${timeText}</strong></p>`,
      });
    }

    if (userEmail) {
      await sendBrevoEmail({
        toEmail: userEmail,
        subject: `Reminder: your session starts in ${minutesLeft} minutes`,
        htmlContent: `<p>Hello ${session.user_name || "there"},</p><p>Your session with ${session.therapist_name || "your therapist"} starts in ${minutesLeft} minutes.</p><p><strong>${dateText} ${timeText}</strong></p>`,
      });
    }
  } catch (error) {
    console.error("Support session reminder email failed:", error);
  }
};

const runSupportSessionAutomation = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.user_id, s.therapist_id, s.call_mode, s.status, s.scheduled_date, s.scheduled_time,
                    t.name AS therapist_name, t.email AS therapist_email,
                    t.user_id AS therapist_user_id,
                    u.name AS user_name, u.email AS user_email
             FROM support_sessions s
             LEFT JOIN therapists t ON t.id = s.therapist_id
             LEFT JOIN users u ON u.id = s.user_id
             WHERE s.status IN ('confirmed', 'accepted', 'live', 'in_progress')
               AND s.scheduled_date IS NOT NULL
               AND s.scheduled_time IS NOT NULL`,
    );

    const nowMs = Date.now();
    for (const session of rows || []) {
      const joinState = getJoinStateForSession(session, nowMs);
      const normalizedStatus = normalizeSupportLifecycleStatus(
        session.status,
        "new",
      );

      if (joinState.minutesToStart !== null) {
        for (const marker of SUPPORT_REMINDER_MINUTES) {
          if (
            joinState.minutesToStart <= marker &&
            joinState.minutesToStart > marker - 1
          ) {
            await emitSupportSessionReminder(session, marker);
          }
        }
      }

      if (
        (normalizedStatus === "confirmed" || normalizedStatus === "accepted") &&
        joinState.phase === "live"
      ) {
        await pool.query(
          "UPDATE support_sessions SET status = ? WHERE id = ?",
          ["live", session.id],
        );

        io.emit("support_session_status_changed", {
          sessionId: Number(session.id),
          status: "live",
          therapistId: Number(session.therapist_id) || null,
          userId: Number(session.user_id) || null,
          callMode:
            String(session.call_mode || "voice").toLowerCase() === "video"
              ? "video"
              : "voice",
        });

        io.emit("support_session_live", {
          sessionId: Number(session.id),
          therapistId: Number(session.therapist_id) || null,
          userId: Number(session.user_id) || null,
          callMode:
            String(session.call_mode || "voice").toLowerCase() === "video"
              ? "video"
              : "voice",
          message: "Your session is starting now",
        });

        await emitNotificationToUser({
          userId: Number(session.user_id) || null,
          sessionId: Number(session.id),
          type: "support_session_live",
          title: resolveNotificationTitle("support_session_live"),
          message: "Your session is starting now",
          payload: {
            therapistId: Number(session.therapist_id) || null,
            callMode:
              String(session.call_mode || "voice").toLowerCase() === "video"
                ? "video"
                : "voice",
          },
          eventKey: `session:${Number(session.id)}:live:user`,
        });

        await emitNotificationToUser({
          userId: Number(session.therapist_user_id || 0) || null,
          sessionId: Number(session.id),
          type: "support_session_live",
          title: resolveNotificationTitle("support_session_live"),
          message: `Session with ${session.user_name || "client"} is starting now`,
          payload: {
            therapistId: Number(session.therapist_id) || null,
            callMode:
              String(session.call_mode || "voice").toLowerCase() === "video"
                ? "video"
                : "voice",
          },
          eventKey: `session:${Number(session.id)}:live:therapist`,
        });
      }
    }
  } catch (error) {
    console.error("Support session automation error:", error);
  }
};

cron.schedule("* * * * *", async () => {
  const dbReady = await isDatabaseAvailable();
  if (!dbReady) return;
  await runSupportSessionAutomation();
});

void (async () => {
  const dbReady = await isDatabaseAvailable();
  if (!dbReady) return;
  await runSupportSessionAutomation();
})();

// Use the unified PostgreSQL pool from db.js

/* ============================
     API ROUTES FOR ADMIN
============================ */

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.delete("/api/support/sessions/:id", async (req, res) => {
  try {
    const adminRequest = isAdminRequest(req);
    const therapistRequest = isTherapistRequest(req);

    if (!adminRequest && !therapistRequest) {
      return res
        .status(403)
        .json({ success: false, error: "Therapist or admin access required" });
    }

    const sessionId = Number(req.params.id);
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });
    }

    const [sessionRows] = await pool.query(
      `SELECT id, therapist_id, user_id
             FROM support_sessions
             WHERE id = ?
             LIMIT 1`,
      [sessionId],
    );

    const currentSession = sessionRows?.[0];
    if (!currentSession) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    if (!adminRequest) {
      const therapistIdFromHeader = await resolveTherapistIdFromHeaders(
        req.headers,
      );
      if (
        !therapistIdFromHeader ||
        Number(currentSession.therapist_id) !== therapistIdFromHeader
      ) {
        return res.status(403).json({
          success: false,
          error: "You can only delete your own sessions",
        });
      }
    }

    await pool.query(
      "DELETE FROM support_session_messages WHERE session_id = ?",
      [sessionId],
    );
    await pool.query("DELETE FROM support_notifications WHERE session_id = ?", [
      sessionId,
    ]);
    await pool.query("DELETE FROM support_sessions WHERE id = ?", [sessionId]);

    io.emit("support_session_status_changed", {
      sessionId,
      status: "deleted",
      therapistId: Number(currentSession.therapist_id) || null,
      userId: Number(currentSession.user_id) || null,
    });

    return res.json({ success: true, data: { deleted: true, sessionId } });
  } catch (error) {
    console.error("Support delete session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete support session" });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM messages ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get("/api/journals", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM journals ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

let buddieDialogExamples = [];
let buddieEmpathyBank = {};

const normalizeText = (value) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTokens = (value) => {
  const cleaned = normalizeText(value);
  if (!cleaned) return [];
  return cleaned.split(" ").filter((token) => token.length >= 3);
};

const hasQuestionSignal = (value) =>
  /\?|\b(why|how|what|when|where|can|could|would|should|is|are|do|did)\b/i.test(
    value || "",
  );

const toSafeText = (value) => (typeof value === "string" ? value.trim() : "");

const resolveDataPath = (candidatePath) => {
  if (!candidatePath) return candidatePath;
  if (path.isAbsolute(candidatePath)) return candidatePath;
  return path.join(__dirname, candidatePath);
};

const resolveExistingDataPath = (candidates = []) => {
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = resolveDataPath(candidate);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    if (fs.existsSync(resolved)) return resolved;
  }
  return null;
};

const loadBuddieEmpathyBank = (candidatePath) => {
  try {
    const resolvedPath = resolveExistingDataPath([
      candidatePath,
      ...BUDDIE_EMPATHY_BANK_FALLBACK_PATHS,
    ]);
    if (!resolvedPath) {
      const attempted = Array.from(
        new Set(
          [candidatePath, ...BUDDIE_EMPATHY_BANK_FALLBACK_PATHS].filter(
            Boolean,
          ),
        ),
      )
        .map((entry) => resolveDataPath(entry))
        .join(", ");
      console.warn(`⚠️ Empathy bank not found. Paths checked: ${attempted}`);
      return {};
    }

    const parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn("⚠️ Empathy bank must be a key-value object of arrays.");
      return {};
    }

    const normalized = Object.entries(parsed).reduce(
      (acc, [emotion, entries]) => {
        if (!Array.isArray(entries)) return acc;
        const cleanEmotion = toSafeText(emotion).toLowerCase() || "neutral";
        const cleanEntries = entries
          .map((entry) => toSafeText(entry))
          .filter((entry) => entry.length >= 4 && entry.length <= 220)
          .filter(
            (entry) =>
              !BUDDIE_UNSAFE_STYLE_PATTERNS.some((pattern) =>
                pattern.test(entry),
              ),
          );

        if (cleanEntries.length)
          acc[cleanEmotion] = Array.from(new Set(cleanEntries));
        return acc;
      },
      {},
    );

    const total = Object.values(normalized).reduce(
      (sum, items) => sum + items.length,
      0,
    );
    console.log(
      `✅ Loaded empathy bank from ${resolvedPath}: ${Object.keys(normalized).length} emotions, ${total} responses`,
    );
    return normalized;
  } catch (error) {
    console.warn(`⚠️ Failed to load empathy bank: ${error.message}`);
    return {};
  }
};

const buildStyleExamplesFromEmpathyBank = (bank = {}) => {
  const emotionPromptMap = {
    sad: "I feel low today.",
    sadness: "I feel low today.",
    lonely: "I feel alone right now.",
    afraid: "I am anxious and worried.",
    anxious: "I am anxious and worried.",
    angry: "I am really frustrated right now.",
    grateful: "Something good happened and I feel thankful.",
    joyful: "I feel happy about today.",
    hopeful: "I want to believe things can improve.",
    neutral: "I am just checking in.",
  };

  const examples = [];
  for (const [emotionKey, responses] of Object.entries(bank)) {
    if (!Array.isArray(responses) || !responses.length) continue;
    const seedPrompt =
      emotionPromptMap[(emotionKey || "").toLowerCase()] ||
      `I'm feeling ${emotionKey} today.`;
    for (const response of responses.slice(0, 20)) {
      examples.push({
        user: seedPrompt,
        buddie: toSafeText(response),
        intent: "empathy_bank",
        emotion: emotionKey,
      });
    }
  }

  return dedupeBuddieExamples(examples)
    .filter(isSafeStyleExample)
    .slice(0, 500);
};

const mapEmotionToEmpathyKey = (emotionLabel, vibeLabel) => {
  const value = (emotionLabel || "").toLowerCase();
  const mapping = {
    sadness: "sad",
    joy: "happy",
    fear: "afraid",
    anger: "angry",
    anxiety: "afraid",
    nervousness: "afraid",
    love: "happy",
    optimism: "happy",
    gratitude: "happy",
    disappointment: "sad",
    grief: "sad",
    loneliness: "sad",
    neutral: "neutral",
  };

  if (mapping[value]) return mapping[value];
  if (vibeLabel === VIBE_LABELS.POSITIVE) return "happy";
  if (vibeLabel === VIBE_LABELS.STRESSED) return "afraid";
  if (vibeLabel === VIBE_LABELS.LOW) return "sad";
  return "neutral";
};

const getEmpathyBankFallback = (emotionLabel, vibeLabel, memoryKey) => {
  if (!buddieEmpathyBank || !Object.keys(buddieEmpathyBank).length) return null;

  const bucket = conversationMemory.get(memoryKey);
  const recent = new Set(
    (bucket?.responses || []).slice(-6).map((item) => normalizeText(item)),
  );
  const emotionKey = mapEmotionToEmpathyKey(emotionLabel, vibeLabel);
  const options = [
    ...(buddieEmpathyBank[emotionKey] || []),
    ...(buddieEmpathyBank.neutral || []),
  ].filter((entry) => !recent.has(normalizeText(entry)));

  if (!options.length) return null;
  return options[Math.floor(Math.random() * options.length)];
};

const getDatasetGroundedFallback = (
  userMessage,
  emotionLabel,
  vibeLabel,
  memoryKey,
) => {
  if (!buddieDialogExamples.length) return null;

  const cleanedMessage = toSafeText(userMessage);
  const userTokens = new Set(extractTokens(cleanedMessage));
  const normalizedEmotion = (emotionLabel || "").toLowerCase();
  const bucket = conversationMemory.get(memoryKey);
  const recent = new Set(
    (bucket?.responses || []).slice(-8).map((item) => normalizeText(item)),
  );

  const ranked = buddieDialogExamples
    .map((example) => {
      const exampleUserTokens = new Set(extractTokens(example.user));
      let overlap = 0;
      for (const token of userTokens) {
        if (exampleUserTokens.has(token)) overlap += 1;
      }

      const questionBoost =
        hasQuestionSignal(cleanedMessage) && hasQuestionSignal(example.user)
          ? 1
          : 0;
      const emotionValue = (example.emotion || "").toLowerCase();
      const emotionBoost =
        normalizedEmotion && emotionValue.includes(normalizedEmotion) ? 1 : 0;
      const vibeBoost = vibeLabel && emotionValue.includes(vibeLabel) ? 1 : 0;
      return {
        example,
        score: overlap + questionBoost + emotionBoost + vibeBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .map((item) => item.example.buddie)
    .filter((reply) => !recent.has(normalizeText(reply)))
    .filter((reply) => reply.length >= 12 && reply.length <= 280);

  if (!ranked.length) return null;
  return ranked[Math.floor(Math.random() * Math.min(ranked.length, 6))];
};

const isSafeStyleExample = (example) => {
  const user = toSafeText(example?.user);
  const buddie = toSafeText(example?.buddie);
  if (!user || !buddie) return false;
  if (user.length < 8 || buddie.length < 12) return false;
  if (buddie.length > 600) return false;

  const merged = `${user}\n${buddie}`;
  return !BUDDIE_UNSAFE_STYLE_PATTERNS.some((pattern) => pattern.test(merged));
};

const dedupeBuddieExamples = (examples = []) => {
  const deduped = [];
  const seen = new Set();
  for (const item of examples) {
    const key = `${item.user}::${item.buddie}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
};

const parseDatasetSpec = (spec = "") => {
  const clean = spec.toString().trim();
  if (!clean) return null;

  const lastColon = clean.lastIndexOf(":");
  if (lastColon > clean.lastIndexOf("/")) {
    return {
      dataset: clean.slice(0, lastColon).trim(),
      config: clean.slice(lastColon + 1).trim() || "default",
    };
  }

  return {
    dataset: clean,
    config: "default",
  };
};

const resolveBuddieHFDatasets = () => {
  const parsed = BUDDIE_HF_DATASETS.map(parseDatasetSpec).filter(
    (item) => item?.dataset,
  );

  const seen = new Set();
  return parsed.filter((item) => {
    const key = `${item.dataset}::${item.config}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mapHFRowToBuddieExample = (row, datasetName = "") => {
  const datasetLower = datasetName.toLowerCase();

  if (datasetLower === "facebook/empathetic_dialogues") {
    const speakerIdx = Number(row?.speaker_idx);
    if (!Number.isNaN(speakerIdx) && speakerIdx !== 1) return null;

    const user = toSafeText(
      row?.prompt ||
        row?.context ||
        row?.situation ||
        row?.Context ||
        row?.input,
    );
    const buddie = toSafeText(
      row?.utterance || row?.response || row?.Response || row?.output,
    );

    return {
      user,
      buddie,
      intent: "empathetic_dialogue",
      emotion: toSafeText(row?.context) || "supportive",
    };
  }

  return {
    user: toSafeText(row?.Context || row?.context || row?.input),
    buddie: toSafeText(row?.Response || row?.response || row?.output),
    intent: "hf_style",
    emotion: "supportive",
  };
};

const fetchHfDatasetSplits = async (datasetName) => {
  const encoded = encodeURIComponent(datasetName);
  const response = await fetch(
    `https://datasets-server.huggingface.co/splits?dataset=${encoded}`,
  );
  if (!response.ok) {
    // HF API intermittently returns 501/502/503. Since we have local calibration datasets,
    // gracefully skip HF enrichment on API failures rather than hard-fail.
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.splits) ? data.splits : [];
};

const loadBuddieExamplesFromHFDataset = async () => {
  const datasetSpecs = resolveBuddieHFDatasets();
  if (!datasetSpecs.length) return [];

  try {
    const allExamples = [];

    for (const { dataset, config } of datasetSpecs) {
      const splits = await fetchHfDatasetSplits(dataset);
      if (!splits.length) {
        continue;
      }
      const splitNames = splits
        .map((entry) => entry?.split || entry)
        .filter(Boolean);

      if (!splitNames.length) {
        continue;
      }

      for (const splitName of splitNames) {
        const encodedDataset = encodeURIComponent(dataset);
        const encodedConfig = encodeURIComponent(config || "default");
        const encodedSplit = encodeURIComponent(splitName);

        const url = `https://datasets-server.huggingface.co/first-rows?dataset=${encodedDataset}&config=${encodedConfig}&split=${encodedSplit}`;
        const response = await fetch(url);
        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const rows = Array.isArray(data?.rows) ? data.rows : [];

        const mapped = rows
          .map((item) => mapHFRowToBuddieExample(item?.row || {}, dataset))
          .filter(Boolean)
          .filter(isSafeStyleExample);

        allExamples.push(...mapped);
      }
    }

    const deduped = dedupeBuddieExamples(allExamples).slice(
      0,
      BUDDIE_HF_ROWS_LIMIT,
    );
    if (deduped.length > 0) {
      console.log(
        `✅ Loaded ${deduped.length} HF examples for Buddie calibration`,
      );
    }
    return deduped;
  } catch (error) {
    console.log(
      `ℹ️ HF dataset hydration skipped (optional enrichment, Buddie uses local datasets)`,
    );
    return [];
  }
};

const loadBuddieDialogExamples = (filePath, label) => {
  try {
    const resolvedPath = resolveDataPath(filePath);

    if (!fs.existsSync(resolvedPath)) {
      console.warn(`⚠️ ${label} file not found at ${resolvedPath}.`);
      return [];
    }

    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`⚠️ ${label} data must be an array.`);
      return [];
    }

    const valid = parsed
      .map((item) => ({
        user: (item?.user || item?.context || "").toString().trim(),
        buddie: (item?.assistant || item?.reply || "").toString().trim(),
        intent: (item?.intent || "").toString().trim(),
        emotion: (item?.emotion || "").toString().trim(),
      }))
      .filter((item) => item.user && item.buddie);

    console.log(
      `✅ Loaded ${valid.length} ${label} examples for Buddie style guidance`,
    );
    return valid;
  } catch (error) {
    console.error(`⚠️ Failed to load ${label} examples:`, error.message);
    return [];
  }
};

const loadAllBuddieStyleExamples = () => {
  const dailyDialog = loadBuddieDialogExamples(
    BUDDIE_DIALOG_DATA_PATH,
    "DailyDialog",
  );
  const counseling = loadBuddieDialogExamples(
    BUDDIE_COUNSELING_DATA_PATH,
    "MentalHealthCounseling",
  );
  const livesiyam = loadBuddieDialogExamples(
    BUDDIE_LIVESIYAM_DATA_PATH,
    "Livesiyam5000",
  );
  const bankForFallback = loadBuddieEmpathyBank(BUDDIE_EMPATHY_BANK_PATH);
  const empathyBankExamples =
    buildStyleExamplesFromEmpathyBank(bankForFallback);
  const merged = [
    ...dailyDialog,
    ...counseling,
    ...livesiyam,
    ...empathyBankExamples,
  ];

  if (!merged.length) {
    console.warn(
      "⚠️ No conversational calibration datasets loaded. Buddie style examples are empty.",
    );
    return DEFAULT_BUDDIE_STYLE_EXAMPLES;
  }

  const deduped = dedupeBuddieExamples(merged);

  console.log(
    `✅ Buddie calibration ready with ${deduped.length} total examples`,
  );
  return deduped;
};

const hydrateBuddieExamplesFromHF = async () => {
  const hfExamples = await loadBuddieExamplesFromHFDataset();
  if (!hfExamples.length) return;

  buddieDialogExamples = dedupeBuddieExamples([
    ...buddieDialogExamples,
    ...hfExamples,
  ]);
  console.log(
    `✅ Buddie calibration enriched with ${hfExamples.length} HF examples`,
  );
};

const normalizeConversationHistory = (history) => {
  if (!Array.isArray(history)) return [];

  const normalized = history
    .map((item) => ({
      role: item?.role === "model" ? "Buddie" : "User",
      text: toSafeText(item?.text),
    }))
    .filter((item) => item.text)
    .slice(-8);

  return normalized;
};

const trimPromptChunk = (value, maxLen = 420) => {
  const text = toSafeText(value);
  if (!text) return "";
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}...`;
};

const VIBE_LABELS = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  LOW: "low",
  STRESSED: "stressed",
  AVOIDANT: "avoidant",
};

const conversationMemory = new Map();
const userProfiles = new Map();
const userEmbeddings = new Map();

const getMemoryBucket = (memoryKey) => {
  if (!conversationMemory.has(memoryKey)) {
    conversationMemory.set(memoryKey, {
      messages: [],
      responses: [],
      emotions: [],
      summary: "",
      summarizedCount: 0,
    });
  }
  return conversationMemory.get(memoryKey);
};

const getDefaultProfile = () => ({
  name: "Friend",
  favoriteTopics: [],
  preferredTone: "friendly",
  recurringMoods: [],
  likedResponses: [],
});

const getProfile = (memoryKey) => {
  if (!userProfiles.has(memoryKey)) {
    userProfiles.set(memoryKey, getDefaultProfile());
  }
  return userProfiles.get(memoryKey);
};

const updateProfile = (memoryKey, updates = {}) => {
  const current = getProfile(memoryKey);
  userProfiles.set(memoryKey, {
    ...current,
    ...updates,
  });
  return userProfiles.get(memoryKey);
};

const extractFavoriteTopics = (text) => {
  const source = normalizeText(text);
  if (!source) return [];

  const topicMap = {
    school: ["school", "exam", "class", "assignment", "campus"],
    work: ["work", "job", "boss", "office", "career"],
    family: ["family", "mum", "dad", "parent", "home"],
    relationship: [
      "relationship",
      "boyfriend",
      "girlfriend",
      "partner",
      "breakup",
    ],
    money: ["money", "rent", "salary", "debt", "bills"],
    faith: ["church", "god", "faith", "prayer", "religion"],
    health: ["sleep", "anxiety", "stress", "depressed", "therapy", "panic"],
  };

  const detected = [];
  for (const [topic, words] of Object.entries(topicMap)) {
    if (words.some((word) => source.includes(word))) {
      detected.push(topic);
    }
  }
  return detected;
};

const updateProfileFromInteraction = (
  memoryKey,
  userMessage,
  emotionLabel,
  toneInstruction,
) => {
  const profile = getProfile(memoryKey);
  const topics = extractFavoriteTopics(userMessage);
  const favoriteTopicSet = new Set([
    ...(profile.favoriteTopics || []),
    ...topics,
  ]);

  const recurring = [...(profile.recurringMoods || [])];
  if (emotionLabel) recurring.push(emotionLabel);

  updateProfile(memoryKey, {
    favoriteTopics: Array.from(favoriteTopicSet).slice(-8),
    recurringMoods: recurring.slice(-12),
    preferredTone: profile.preferredTone || toneInstruction || "friendly",
  });
};

const rememberConversation = (
  memoryKey,
  userMessage,
  botResponse,
  emotionLabel,
) => {
  const bucket = getMemoryBucket(memoryKey);
  bucket.messages.push(toSafeText(userMessage));
  bucket.responses.push(toSafeText(botResponse));
  bucket.emotions.push((emotionLabel || "").toLowerCase());

  while (bucket.messages.length > BUDDIE_MEMORY_MAX) bucket.messages.shift();
  while (bucket.responses.length > BUDDIE_MEMORY_MAX) bucket.responses.shift();
  while (bucket.emotions.length > BUDDIE_MEMORY_MAX) bucket.emotions.shift();
};

const hasRecentlySaid = (memoryKey, candidate) => {
  if (!candidate) return false;
  const bucket = conversationMemory.get(memoryKey);
  if (!bucket) return false;
  const normalizedCandidate = normalizeText(candidate);
  return bucket.responses.some(
    (reply) => normalizeText(reply) === normalizedCandidate,
  );
};

const cosineSimilarity = (a = [], b = []) => {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const createEmbedding = async (memoryKey, text) => {
  if (!text || !openai || !aiConfig.openai.key) return null;
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const vector = response?.data?.[0]?.embedding;
    if (!vector) return null;

    if (!userEmbeddings.has(memoryKey)) {
      userEmbeddings.set(memoryKey, []);
    }

    const bucket = userEmbeddings.get(memoryKey);
    bucket.push({ vector, text, createdAt: Date.now() });
    while (bucket.length > BUDDIE_MEMORY_MAX) bucket.shift();

    return vector;
  } catch (error) {
    return null;
  }
};

const querySimilarMemory = async (memoryKey, text, topK = 3) => {
  const bucket = userEmbeddings.get(memoryKey);
  if (!bucket || !bucket.length || !openai || !aiConfig.openai.key) {
    const memoryBucket = conversationMemory.get(memoryKey);
    return (memoryBucket?.messages || []).slice(-topK);
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    const queryVector = response?.data?.[0]?.embedding;
    if (!queryVector) return [];

    return bucket
      .map((item) => ({
        text: item.text,
        score: cosineSimilarity(queryVector, item.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.text);
  } catch (error) {
    return [];
  }
};

const buildMemoryContext = (memoryKey) => {
  const bucket = conversationMemory.get(memoryKey);
  if (!bucket || !bucket.messages.length) return "";

  const recentMessages = bucket.messages.slice(-BUDDIE_MEMORY_WINDOW);
  const recentResponses = bucket.responses.slice(-BUDDIE_MEMORY_WINDOW);

  return recentMessages
    .map((msg, idx) => `User: ${msg}\nBuddie: ${recentResponses[idx] || ""}`)
    .join("\n");
};

const getToneByEmotion = (emotionLabel, vibeLabel) => {
  const normalizedEmotion = (emotionLabel || "").toLowerCase();
  if (normalizedEmotion === "joy") return "upbeat and cheerful";
  if (normalizedEmotion === "sadness")
    return "gentle, supportive, and empathetic";
  if (normalizedEmotion === "anger") return "calm and soothing";
  if (normalizedEmotion === "fear") return "reassuring and grounding";
  if (normalizedEmotion === "neutral") return "friendly and open-ended";

  if (vibeLabel === VIBE_LABELS.LOW)
    return "gentle, supportive, and empathetic";
  if (vibeLabel === VIBE_LABELS.STRESSED) return "calm and grounding";
  if (vibeLabel === VIBE_LABELS.POSITIVE) return "upbeat and encouraging";
  return "friendly and human";
};

const getEmotionFallback = (
  emotionLabel,
  vibeLabel,
  memoryKey,
  userMessage = "",
) => {
  const datasetReply = getDatasetGroundedFallback(
    userMessage,
    emotionLabel,
    vibeLabel,
    memoryKey,
  );
  if (datasetReply) return datasetReply;

  const empathyBankReply = getEmpathyBankFallback(
    emotionLabel,
    vibeLabel,
    memoryKey,
  );
  if (empathyBankReply) return empathyBankReply;

  return null;
};

const getAdaptiveFallback = ({
  kenyanDetection,
  emotionLabel,
  vibeLabel,
  memoryKey,
  userMessage,
}) => {
  return getEmotionFallback(emotionLabel, vibeLabel, memoryKey, userMessage);
};

async function tryOpenAI(message) {
  if (!openai) return null;

  const completion = await openai.chat.completions.create({
    model: aiConfig.openai.model,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: message },
    ],
    max_tokens: BUDDIE_REPLY_MAX_TOKENS,
  });

  return completion?.choices?.[0]?.message?.content || null;
}

async function tryGroq(message) {
  if (!groq) return null;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: message },
    ],
    max_tokens: BUDDIE_REPLY_MAX_TOKENS,
  });

  return completion?.choices?.[0]?.message?.content || null;
}

async function buddieAI(userMessage, emotionLabel, vibeLabel, memoryKey) {
  const providers = [tryOpenAI, tryGroq];

  for (const provider of providers) {
    try {
      const result = await provider(userMessage);
      if (result) {
        console.log("AI provider success:", provider.name);
        return result;
      }
    } catch (err) {
      console.log(`${provider.name} failed:`, err?.message || err);
    }
  }

  console.log("OpenAI and Groq were unavailable for this request.");
  return null;
}

const shouldSuggestProfessionalSupport = ({
  distressLevel,
  llmAnalysis,
  cleanedMessage = "",
}) => {
  if (distressLevel === "severe") return true;

  const urgency = (llmAnalysis?.urgency || "").toLowerCase();
  const intent = (llmAnalysis?.intent || "").toLowerCase();
  if (urgency === "high") return true;
  if (intent === "crisis" || intent === "avoidant") return true;

  const sensitivePattern =
    /(self harm|hurt myself|hopeless|i can\'t cope|panic attacks?|trauma|abuse|suicid)/i;
  return sensitivePattern.test(cleanedMessage);
};

const summarizeContext = async (memoryKey) => {
  const bucket = conversationMemory.get(memoryKey);
  if (!bucket) return "";
  if (bucket.messages.length <= BUDDIE_MEMORY_WINDOW) return "";

  const cutoff = bucket.messages.length - BUDDIE_MEMORY_WINDOW;
  if (bucket.summary && bucket.summarizedCount === cutoff)
    return bucket.summary;

  const oldMessages = bucket.messages.slice(0, cutoff);
  const oldResponses = bucket.responses.slice(0, cutoff);
  const contextText = oldMessages
    .map(
      (message, index) =>
        `User: ${message}\nUnity: ${oldResponses[index] || ""}`,
    )
    .join("\n");

  const summaryPrompt = `Summarize this prior chat in 3-5 short sentences. Keep emotional patterns, recurring worries, and wins.\n\n${contextText}`;
  const summaryInstruction =
    "You are a concise memory summarizer for a supportive mental-health friend. Return plain text only.";

  try {
    const summary = await callAI(summaryPrompt, summaryInstruction);
    const safeSummary = toSafeText(summary);
    bucket.summary = safeSummary;
    bucket.summarizedCount = cutoff;
    return safeSummary;
  } catch (error) {
    return bucket.summary || "";
  }
};

const resolveMemoryKey = (req, bodyUserId) => {
  const explicitId = bodyUserId || req.headers["x-user-id"];
  if (explicitId) return `user:${explicitId}`;

  const emailHeader = (req.headers["x-user-email"] || "")
    .toString()
    .trim()
    .toLowerCase();
  if (emailHeader) return `email:${emailHeader}`;

  return `ip:${req.ip || req.socket?.remoteAddress || "anonymous"}`;
};

const mapEmotionToVibe = (emotionLabel) => {
  const value = (emotionLabel || "").toLowerCase();
  if (!value) return null;

  if (["joy", "love", "optimism", "gratitude", "amusement"].includes(value))
    return VIBE_LABELS.POSITIVE;
  if (["sadness", "grief", "disappointment", "loneliness"].includes(value))
    return VIBE_LABELS.LOW;
  if (
    [
      "anger",
      "annoyance",
      "frustration",
      "fear",
      "anxiety",
      "nervousness",
    ].includes(value)
  )
    return VIBE_LABELS.STRESSED;
  if (["neutral"].includes(value)) return VIBE_LABELS.NEUTRAL;
  return null;
};

const mapMoodToVibe = (mood = "") => {
  const value = String(mood).toLowerCase();
  if (value === "positive") return VIBE_LABELS.POSITIVE;
  if (value === "low") return VIBE_LABELS.LOW;
  if (value === "angry" || value === "anxious") return VIBE_LABELS.STRESSED;
  if (value === "crisis_low") return VIBE_LABELS.LOW;
  return VIBE_LABELS.NEUTRAL;
};

const detectEmotion = async (userText) => {
  const token = aiConfig.emotion.hfKey;
  if (!token || !userText) return null;

  const { signal, cancel } = createTimeoutSignal(
    Math.min(AI_TIMEOUT_MS, 12000),
  );
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_EMOTION_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: userText }),
        signal,
      },
    );

    if (!response.ok) return null;
    const data = await response.json();

    const ranked = Array.isArray(data)
      ? Array.isArray(data[0])
        ? data[0]
        : data
      : [];

    if (!Array.isArray(ranked) || !ranked.length) return null;
    const top = ranked.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    return top?.label ? String(top.label).toLowerCase() : null;
  } catch (error) {
    return null;
  } finally {
    cancel();
  }
};

const DEFAULT_LLM_MESSAGE_ANALYSIS = {
  intent: "support_request",
  emotionLabel: "neutral",
  urgency: "low",
  confidence: 0.5,
  recommendedTone: "warm and supportive",
  responseGoal: "Acknowledge and invite gentle sharing.",
  followUpStyle: "one_open_question",
  shouldAskFollowUp: true,
  shouldUseKenyanWarmth: true,
  shortSummary: "",
};

const normalizeLlmMessageAnalysis = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const allowedIntent = new Set([
    "greeting",
    "small_talk",
    "support_request",
    "venting",
    "advice_request",
    "gratitude",
    "avoidant",
    "crisis",
  ]);
  const allowedUrgency = new Set(["low", "medium", "high"]);

  const parsedConfidence = Number(source.confidence);
  const confidence = Number.isFinite(parsedConfidence)
    ? Math.max(0, Math.min(1, parsedConfidence))
    : DEFAULT_LLM_MESSAGE_ANALYSIS.confidence;

  return {
    intent: allowedIntent.has((source.intent || "").toString())
      ? source.intent
      : DEFAULT_LLM_MESSAGE_ANALYSIS.intent,
    emotionLabel:
      toSafeText(
        source.emotionLabel || DEFAULT_LLM_MESSAGE_ANALYSIS.emotionLabel,
      ).toLowerCase() || DEFAULT_LLM_MESSAGE_ANALYSIS.emotionLabel,
    urgency: allowedUrgency.has((source.urgency || "").toString())
      ? source.urgency
      : DEFAULT_LLM_MESSAGE_ANALYSIS.urgency,
    confidence,
    recommendedTone: toSafeText(
      source.recommendedTone || DEFAULT_LLM_MESSAGE_ANALYSIS.recommendedTone,
    ),
    responseGoal: toSafeText(
      source.responseGoal || DEFAULT_LLM_MESSAGE_ANALYSIS.responseGoal,
    ),
    followUpStyle: toSafeText(
      source.followUpStyle || DEFAULT_LLM_MESSAGE_ANALYSIS.followUpStyle,
    ),
    shouldAskFollowUp: source.shouldAskFollowUp !== false,
    shouldUseKenyanWarmth: source.shouldUseKenyanWarmth !== false,
    shortSummary: toSafeText(source.shortSummary || ""),
  };
};

const analyzeMessageWithLLM = async ({
  message,
  mood,
  note,
  intensity,
  history,
  memoryContext,
  contextSummary,
  distressLevel,
  fallbackEmotion,
  fallbackVibe,
}) => {
  const cleaned = toSafeText(message);
  if (!cleaned) return DEFAULT_LLM_MESSAGE_ANALYSIS;

  const recentUserHistory = normalizeConversationHistory(history)
    .slice(-8)
    .map((entry) => `${entry.role}: ${entry.text}`)
    .join("\n");

  const prompt = [
    "Analyze this user message for a mental-health companion assistant and return JSON only.",
    "",
    `Latest message: ${cleaned}`,
    `Reported mood: ${mood || "unknown"}`,
    `Intensity: ${intensity || "unknown"}`,
    `Note: ${note || "none"}`,
    `Rule-based emotion hint: ${fallbackEmotion || "unknown"}`,
    `Rule-based vibe hint: ${fallbackVibe || "neutral"}`,
    `Distress level hint: ${distressLevel || "none"}`,
    `Conversation summary: ${contextSummary || "none"}`,
    `Memory context: ${memoryContext || "none"}`,
    recentUserHistory
      ? `Recent history:\n${recentUserHistory}`
      : "Recent history: none",
    "",
    "Output JSON schema:",
    "{",
    '  "intent": "greeting|small_talk|support_request|venting|advice_request|gratitude|avoidant|crisis",',
    '  "emotionLabel": "short lowercase label",',
    '  "urgency": "low|medium|high",',
    '  "confidence": 0.0,',
    '  "recommendedTone": "tone guidance",',
    '  "responseGoal": "one-line strategy",',
    '  "followUpStyle": "one_open_question|none|reflective",',
    '  "shouldAskFollowUp": true,',
    '  "shouldUseKenyanWarmth": true,',
    '  "shortSummary": "single-line interpretation"',
    "}",
    "No markdown, no explanations. JSON only.",
  ].join("\n");

  const instruction =
    "You are an emotionally intelligent message analyzer for a supportive friend chatbot. Be precise and safety-first.";

  try {
    const analysis = await callAI(prompt, instruction, {
      json: true,
      retries: 1,
    });
    return normalizeLlmMessageAnalysis(analysis);
  } catch (error) {
    return DEFAULT_LLM_MESSAGE_ANALYSIS;
  }
};

const VIBE_KEYWORDS = {
  positive: [
    "happy",
    "good",
    "great",
    "fine",
    "poa",
    "sawa",
    "freshi",
    "nice",
    "amazing",
    "better",
    "😄",
    "✨",
    "😁",
    "😊",
  ],
  neutral: [
    "hi",
    "hello",
    "hey",
    "sasa",
    "wassup",
    "sup",
    "uko poa",
    "not bad",
    "mambo",
    "niaje",
  ],
  low: [
    "sad",
    "tired",
    "lonely",
    "hurt",
    "down",
    "niko down",
    "sijiskii poa",
    "empty",
    "drained",
    "hopeless",
    "😔",
    "😞",
    "💔",
  ],
  stressed: [
    "stressed",
    "angry",
    "frustrated",
    "annoyed",
    "wawa",
    "too much",
    "overwhelmed",
    "can't do this",
    "siwezi",
    "nimechoka",
    "😤",
    "😡",
  ],
  avoidant: [
    "i dont want support",
    "i don't want support",
    "leave me",
    "stop",
    "go away",
    "not now",
    "sitaki",
    "acha",
  ],
};

const detectUserVibe = ({ message, mood, history }) => {
  const text =
    `${toSafeText(message)} ${(mood || "").toString()}`.toLowerCase();
  const recentUserLine = Array.isArray(history)
    ? history
        .map((item) =>
          item?.role === "user" ? toSafeText(item?.text).toLowerCase() : "",
        )
        .filter(Boolean)
        .slice(-1)[0] || ""
    : "";

  const combined = `${text} ${recentUserLine}`;
  const score = {
    positive: 0,
    neutral: 0,
    low: 0,
    stressed: 0,
    avoidant: 0,
  };

  for (const [label, words] of Object.entries(VIBE_KEYWORDS)) {
    for (const word of words) {
      if (combined.includes(word)) score[label] += 1;
    }
  }

  if (/\b(fine|okay|ok|not bad)\b/i.test(combined)) score.neutral += 1;
  if (/\b(really bad|terrible|done|fed up)\b/i.test(combined))
    score.stressed += 1;

  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  const topLabel = best?.[1] > 0 ? best[0] : VIBE_LABELS.NEUTRAL;

  return {
    label: topLabel,
    scores: score,
  };
};

const DISTRESS_RULES = {
  severe: [
    "want to die",
    "kill myself",
    "suicide",
    "end my life",
    "self harm",
    "i am done living",
    "i cant go on",
    "nataka kufa",
    "sitaki kuishi",
  ],
  moderate: [
    "panic attack",
    "cant breathe",
    "i am breaking down",
    "everything is too much",
    "hopeless",
    "nimelemewa",
    "sina nguvu",
  ],
};

const detectDistressLevel = ({ message, mood, history }) => {
  const lastUserText = Array.isArray(history)
    ? history
        .filter((item) => item?.role === "user")
        .slice(-3)
        .map((item) => toSafeText(item?.text).toLowerCase())
        .join(" ")
    : "";

  const combined = `${toSafeText(message).toLowerCase()} ${(mood || "").toString().toLowerCase()} ${lastUserText}`;

  if (DISTRESS_RULES.severe.some((phrase) => combined.includes(phrase))) {
    return "severe";
  }

  if (DISTRESS_RULES.moderate.some((phrase) => combined.includes(phrase))) {
    return "moderate";
  }

  return "none";
};

const checkForCrisis = (text) => {
  const source = toSafeText(text).toLowerCase();
  if (!source) return false;
  return DISTRESS_RULES.severe.some((keyword) => source.includes(keyword));
};

const getCrisisResponse = () => {
  return "I’m concerned about your safety. Please contact a trained professional immediately: +254 722 203 100 (Kenya Suicide Prevention Helpline). If you are in immediate danger, call local emergency services now.";
};

const summarizeEmotionTrend = (history) => {
  if (!Array.isArray(history))
    return {
      repeatedLow: false,
      repeatedStress: false,
      summary: "No strong emotional trend detected yet.",
    };

  const userMessages = history
    .filter((item) => item?.role === "user")
    .slice(-10)
    .map((item) => toSafeText(item?.text))
    .filter(Boolean);

  if (!userMessages.length) {
    return {
      repeatedLow: false,
      repeatedStress: false,
      summary: "No strong emotional trend detected yet.",
    };
  }

  let lowCount = 0;
  let stressedCount = 0;

  for (const text of userMessages) {
    const vibe = detectUserVibe({ message: text, mood: "", history: [] });
    if (vibe.label === VIBE_LABELS.LOW) lowCount += 1;
    if (vibe.label === VIBE_LABELS.STRESSED) stressedCount += 1;
  }

  const repeatedLow = lowCount >= 3;
  const repeatedStress = stressedCount >= 3;

  let summary = "No strong emotional trend detected yet.";
  if (repeatedLow) {
    summary = "User has shown repeated low mood across recent messages.";
  } else if (repeatedStress) {
    summary =
      "User has shown repeated stress/frustration across recent messages.";
  }

  return { repeatedLow, repeatedStress, summary };
};

const getVibeStyleGuide = (vibeLabel) => {
  switch (vibeLabel) {
    case VIBE_LABELS.POSITIVE:
      return "Vibe is positive/light: match upbeat tone, keep warmth, add light playful energy, then ask one curious follow-up.";
    case VIBE_LABELS.LOW:
      return "Vibe is low mood: acknowledge pain first, normalize gently, be soft and grounding, ask one safe open question.";
    case VIBE_LABELS.STRESSED:
      return "Vibe is stressed/angry: validate intensity without judging, lower emotional temperature, offer two simple options (vent or next step).";
    case VIBE_LABELS.AVOIDANT:
      return "Vibe is avoidant/closed: respect boundaries, do not push support, offer presence and low-pressure availability.";
    default:
      return "Vibe is neutral/small talk: keep it friendly and natural, mirror user language, ask one gentle check-in question.";
  }
};

const buildBuddieUserPrompt = ({
  message,
  mood,
  note,
  intensity,
  history,
  vibeProfile,
  trendProfile,
  distressLevel,
  memoryContext,
  emotionLabel,
  contextSummary,
  toneInstruction,
  profileContext,
  semanticMemory,
  kenyanSlangContext,
  llmAnalysis,
}) => {
  const cleanedMessage = toSafeText(message);
  if (!cleanedMessage && !mood) {
    return "Hello Buddie.";
  }

  const chunks = [];
  const normalizedHistory = normalizeConversationHistory(history);

  if (normalizedHistory.length) {
    chunks.push(
      "Recent conversation context (most recent last):",
      ...normalizedHistory.map((entry) => `${entry.role}: ${entry.text}`),
      "",
    );
  }

  if (mood) {
    chunks.push(
      `Mood context: user reports mood="${mood}" intensity="${intensity || "unknown"}" note="${note || "none"}"`,
    );
  }

  if (cleanedMessage) {
    chunks.push(`Latest user message: ${cleanedMessage}`);
  }

  if (emotionLabel) {
    chunks.push(`Detected emotion label: ${emotionLabel}`);
  }

  if (vibeProfile?.label) {
    chunks.push(`Detected vibe: ${vibeProfile.label}`);
  }

  if (memoryContext) {
    chunks.push(
      "Short-term memory context:",
      trimPromptChunk(memoryContext, 700),
    );
  }

  if (profileContext) {
    chunks.push(
      `User profile context: ${trimPromptChunk(profileContext, 260)}`,
    );
  }

  if (semanticMemory) {
    chunks.push(
      `Relevant past topics: ${trimPromptChunk(semanticMemory, 320)}`,
    );
  }

  if (kenyanSlangContext) {
    chunks.push(
      `Kenyan slang interpretation: ${trimPromptChunk(kenyanSlangContext, 220)}`,
    );
  }

  if (contextSummary) {
    chunks.push(`Long-chat summary: ${trimPromptChunk(contextSummary, 380)}`);
  }

  if (trendProfile?.summary) {
    chunks.push(`Recent emotional trend: ${trendProfile.summary}`);
  }

  if (distressLevel && distressLevel !== "none") {
    chunks.push(`Distress signal level: ${distressLevel}`);
  }

  if (llmAnalysis) {
    chunks.push(
      `LLM analysis: intent=${llmAnalysis.intent}, emotion=${llmAnalysis.emotionLabel}, urgency=${llmAnalysis.urgency}, confidence=${llmAnalysis.confidence}.`,
      `LLM response strategy: tone="${llmAnalysis.recommendedTone}", goal="${llmAnalysis.responseGoal}", followUpStyle="${llmAnalysis.followUpStyle}", askFollowUp=${llmAnalysis.shouldAskFollowUp}.`,
    );
    if (llmAnalysis.shortSummary) {
      chunks.push(`LLM interpretation: ${llmAnalysis.shortSummary}`);
    }
  }

  chunks.push(
    "Reply in 1-2 sentences max. Keep it brief, casual, natural.",
    "Acknowledge their vibe. Ask ONE short question or offer one small thing.",
    "Never repeat phrases from recent replies. Vary every time.",
    `Tone: ${toneInstruction || "casual and warm"}.`,
  );

  if (trendProfile?.repeatedLow || trendProfile?.repeatedStress) {
    chunks.push(
      'Gently acknowledge patterns over time (e.g., "I’ve noticed this has been heavy for a few days"). Keep it supportive, not clinical.',
    );
  }

  if (distressLevel === "moderate") {
    chunks.push(
      "User may be emotionally overloaded. Prioritize grounding and emotional safety before suggestions.",
    );
  }

  if (vibeProfile?.label) {
    chunks.push(`Tone guidance: ${getVibeStyleGuide(vibeProfile.label)}`);
  }

  return chunks.join("\n");
};

const ensureDefaultRoomsSeeded = async () => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM chat_rooms");
    const rawCount = rows?.[0]?.count;
    const count =
      typeof rawCount === "number" ? rawCount : parseInt(rawCount || "0", 10);

    if (count > 0) return;

    for (const room of DEFAULT_CHAT_ROOMS) {
      await pool.query(
        "INSERT INTO chat_rooms (name, description, type) VALUES (?, ?, ?)",
        room,
      );
    }
    console.log("✅ Default chat rooms seeded");
  } catch (err) {
    console.error(
      "⚠️ Could not seed chat rooms (Database might be unavailable):",
      err.message,
    );
  }
};

const selectDialogExamplesForPrompt = (
  userPrompt,
  vibeProfile,
  count = BUDDIE_DIALOG_FEWSHOT_COUNT,
) => {
  if (!buddieDialogExamples.length) return [];

  const userTokens = new Set(extractTokens(userPrompt));
  const userHasQuestion = hasQuestionSignal(userPrompt);

  const ranked = buddieDialogExamples
    .map((example) => {
      const exTokens = new Set(extractTokens(example.user));
      let overlap = 0;
      for (const token of userTokens) {
        if (exTokens.has(token)) overlap += 1;
      }

      const questionBoost =
        userHasQuestion && hasQuestionSignal(example.user) ? 1 : 0;
      const emotionValue = (example.emotion || "").toLowerCase();
      const vibeMatchBoost =
        vibeProfile?.label && emotionValue.includes(vibeProfile.label) ? 1 : 0;
      const score = overlap + questionBoost + vibeMatchBoost;
      return { example, score };
    })
    .sort((a, b) => b.score - a.score);

  const topMatches = ranked
    .filter((item) => item.score > 0)
    .slice(0, count)
    .map((item) => item.example);
  if (topMatches.length >= count) return topMatches;

  const selectedIds = new Set(
    topMatches.map((item) => `${item.user}::${item.buddie}`),
  );
  const fillers = buddieDialogExamples
    .filter((item) => !selectedIds.has(`${item.user}::${item.buddie}`))
    .slice(0, count - topMatches.length);

  return [...topMatches, ...fillers];
};

const buildBuddieSystemInstruction = (userPrompt, vibeProfile) => {
  const examples = selectDialogExamplesForPrompt(userPrompt, vibeProfile);
  if (!examples.length) return SYSTEM_INSTRUCTION;

  const fewShotBlock = examples
    .map((example, index) => {
      const tags = [
        example.intent && `intent=${example.intent}`,
        example.emotion && `emotion=${example.emotion}`,
      ]
        .filter(Boolean)
        .join(", ");
      const tagLine = tags ? ` (${tags})` : "";

      return `Example ${index + 1}${tagLine}\nUser: ${example.user}\nBuddie: ${example.buddie}`;
    })
    .join("\n\n");

  return `${SYSTEM_INSTRUCTION}\n\nEMOTION-AWARE RESPONSE MODE\nDetected vibe: ${vibeProfile?.label || "neutral"}. Mirror user emotional energy safely and compassionately.\n\nNATURAL CONVERSATION CALIBRATION\nUse the examples below only to improve smooth, human pacing and tone for everyday conversation.\nDo NOT copy text verbatim.\nSafety and crisis rules above always override style examples.\n\n${fewShotBlock}`;
};

buddieDialogExamples = loadAllBuddieStyleExamples();
buddieEmpathyBank = loadBuddieEmpathyBank(BUDDIE_EMPATHY_BANK_PATH);
hydrateBuddieExamplesFromHF().catch((error) => {
  console.warn(`⚠️ Failed to hydrate Buddie HF examples: ${error.message}`);
});

// Initialize OpenAI (primary)
let openai;
try {
  if (aiConfig.openai.key && !aiConfig.openai.key.startsWith("your_")) {
    openai = new OpenAI({
      apiKey: aiConfig.openai.key,
      timeout: AI_TIMEOUT_MS,
    });
    console.log("✨ OpenAI initialized");
  } else {
    console.warn("⚠️ OpenAI API key is missing or placeholder.");
  }
} catch (error) {
  console.warn("⚠️ Failed to initialize OpenAI:", error.message);
}

// Initialize Groq fallback
let groq;
try {
  if (aiConfig.groq.key && !aiConfig.groq.key.startsWith("your_")) {
    groq = new OpenAI({
      apiKey: aiConfig.groq.key,
      baseURL: GROQ_BASE_URL,
      timeout: AI_TIMEOUT_MS,
    });
    console.log(`✨ Groq initialized as fallback (Model: ${GROQ_MODEL})`);
  } else {
    console.warn("⚠️ Groq API key is missing or placeholder.");
  }
} catch (error) {
  console.warn("⚠️ Failed to initialize Groq:", error.message);
}

logAiProviderStatus();

// Middleware
app.set("trust proxy", true);
app.use(cors());
// Increase payload limit to 50MB to allow large image uploads as data URLs
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const getPublicBaseUrl = (req) => {
  if (process.env.RESET_PASSWORD_BASE_URL) {
    if (isProduction && isLocalAddress(process.env.RESET_PASSWORD_BASE_URL)) {
      console.warn(
        "⚠️ RESET_PASSWORD_BASE_URL points to localhost in production. Falling back to request host.",
      );
    } else {
      return process.env.RESET_PASSWORD_BASE_URL.replace(/\/$/, "");
    }
  }

  const forwardedProto = (req.headers["x-forwarded-proto"] || "")
    .toString()
    .split(",")[0]
    .trim();
  const forwardedHost = (req.headers["x-forwarded-host"] || "")
    .toString()
    .split(",")[0]
    .trim();
  const host =
    forwardedHost || req.get("host") || process.env.WEBSITE_HOSTNAME || "";
  const protocol = forwardedProto || req.protocol || "https";

  if (!host) {
    return RESET_PASSWORD_BASE_URL.replace(/\/$/, "");
  }

  return `${protocol}://${host}`.replace(/\/$/, "");
};

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/ai/config-status", (_req, res) => {
  return res.json({
    success: true,
    source: "runtime-env",
    providers: getAiProviderStatus(),
    note: "If you updated Azure App Settings, restart the App Service to reload provider clients.",
  });
});

app.post("/api/client-logs/auth", (req, res) => {
  try {
    const { event, provider, stage, message, code } = req.body || {};
    const forwardedFor = (req.headers["x-forwarded-for"] || "")
      .toString()
      .split(",")[0]
      .trim();
    const clientIp = forwardedFor || req.ip || "unknown";
    const userAgent = req.get("user-agent") || "unknown";

    console.error("[CLIENT_AUTH_EVENT]", {
      event: event || "unknown",
      provider: provider || "unknown",
      stage: stage || "unknown",
      code: code || "unknown",
      message: message || "No message provided",
      clientIp,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to persist client auth event:", error);
    return res.status(500).json({ error: "Failed to log client auth event" });
  }
});

app.use(async (req, res, next) => {
  try {
    if (req.method !== "GET" || req.appType === "events") {
      return next();
    }

    if (req.path.startsWith("/api")) {
      return next();
    }

    const acceptsHtml = String(req.headers.accept || "").includes("text/html");
    const hasExtension = path.extname(req.path || "") !== "";
    if (!acceptsHtml || hasExtension) {
      return next();
    }

    const normalizedPath = (req.path || "/").replace(/\/+$/, "") || "/";

    if (
      normalizedPath === "/events" ||
      normalizedPath.startsWith("/private/")
    ) {
      const destinationPath =
        normalizedPath === "/events" ? "/" : normalizedPath;
      const target = `${resolveCanonicalEventsBase(req)}${destinationPath}${req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""}`;
      return res.redirect(302, target);
    }

    const slugMatch = normalizedPath.match(/^\/([a-z0-9-]+)$/i);
    if (!slugMatch) {
      return next();
    }

    const slug = slugMatch[1].toLowerCase();
    if (MAIN_APP_RESERVED_PATHS.has(slug)) {
      return next();
    }

    try {
      const [rows] = await pool.query(
        "SELECT id FROM events WHERE slug = ? LIMIT 1",
        [slug],
      );
      if (!rows?.length) {
        return next();
      }

      const target = `${resolveCanonicalEventsBase(req)}/${slug}${req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""}`;
      return res.redirect(302, target);
    } catch (slugLookupError) {
      // If DB is temporarily unavailable, keep events deep links canonical.
      console.warn(
        "Events slug lookup failed, falling back to canonical redirect:",
        slugLookupError?.message || slugLookupError,
      );
      const target = `${resolveCanonicalEventsBase(req)}/${slug}${req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""}`;
      return res.redirect(302, target);
    }
  } catch (error) {
    console.error("Events canonical redirect middleware error:", error);
    return next();
  }
});

// Initialize database and default rooms on startup
testConnection();
initializeDatabase().then(async () => {
  const dbReady = await isDatabaseAvailable();
  if (!dbReady) return;
  await ensureDefaultRoomsSeeded();
});

// Signup endpoint
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, emergencyContact } = req.body || {};

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        message: "Please provide both email and password",
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: "User already exists",
        message: "This email is already registered. Try logging in instead.",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    // We populate both emergency_contact (our new col) and emergency_phone (legacy col)
    // just to be safe and consistent.
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, emergency_contact, emergency_phone) VALUES (?, ?, ?, ?, ?)",
      [
        name || null,
        email,
        hashedPassword,
        emergencyContact || null,
        emergencyContact || null,
      ],
    );

    const nextUser = {
      id: result.insertId,
      name: name || null,
      email: email,
      role: "user",
      emergencyContact: emergencyContact || null,
    };
    setSharedUserCookie(req, res, nextUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      userId: result.insertId,
      user: nextUser,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Something went wrong. Please try again.",
    });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Please provide both email and password",
      });
    }

    // Find user by email
    // Note: selecting password_hash as password for internal use
    const [users] = await pool.query(
      "SELECT id, name, email, password_hash as password, emergency_contact, role FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Return user data (excluding password)
    const nextUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      emergencyContact: user.emergency_contact,
    };
    setSharedUserCookie(req, res, nextUser);

    res.json({
      success: true,
      message: "Login successful",
      user: nextUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Something went wrong. Please try again.",
    });
  }
});

app.post("/api/support/therapist-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Please provide both email and password",
      });
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, password_hash, specialization, status
             FROM therapists
             WHERE LOWER(email) = LOWER(?)
             LIMIT 1`,
      [email],
    );

    if (!rows?.length) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const therapist = rows[0];
    if (
      !["approved", "active"].includes((therapist.status || "").toLowerCase())
    ) {
      return res.status(403).json({
        error: "Not approved",
        message: "Therapist account is pending admin approval.",
      });
    }

    if (!therapist.password_hash) {
      return res.status(403).json({
        error: "Password not set",
        message: "Your therapist password has not been set by admin.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      therapist.password_hash,
    );
    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const nextUser = {
      id: therapist.id,
      therapistId: therapist.id,
      name: therapist.name,
      email: therapist.email,
      role: "therapist",
      specialization: therapist.specialization,
    };
    setSharedUserCookie(req, res, nextUser);

    return res.json({
      success: true,
      message: "Therapist login successful",
      user: nextUser,
    });
  } catch (error) {
    console.error("Therapist login error:", error);
    return res.status(500).json({
      error: "Server error",
      message: "Something went wrong. Please try again.",
    });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Missing email",
        message: "Please provide your email address.",
      });
    }

    const [users] = await pool.query(
      "SELECT id, email FROM users WHERE email = ?",
      [email],
    );
    const user = users[0];

    if (!user) {
      return res.json({
        message: "If the email exists, a reset link will be sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?",
      [token, expires, email],
    );

    const baseUrl = getPublicBaseUrl(req);
    const resetLink = `${baseUrl}/reset-password/${token}`;
    await sendResetEmail(email, resetLink);

    return res.json({
      message: "If the email exists, a reset link will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: "Server error",
      message: "Unable to process password reset right now.",
    });
  }
});

app.get("/api/auth/unity-user", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies[UNITY_SHARED_AUTH_COOKIE];
    const payload = verifySharedAuthToken(token);
    if (!payload?.userId) {
      return res
        .status(401)
        .json({ success: false, error: "No shared session" });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, role, emergency_contact, display_name, profile_image, auth_provider, clerk_user_id FROM users WHERE id = ? LIMIT 1",
      [Number(payload.userId)],
    );

    const user = rows?.[0];
    if (!user) {
      clearSharedUserCookie(req, res);
      return res
        .status(401)
        .json({ success: false, error: "Session user not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.display_name || user.name,
        email: user.email,
        role: user.role || "user",
        emergencyContact: user.emergency_contact || null,
        profileImage: user.profile_image || null,
        authProvider: user.auth_provider || "local",
        clerkUserId: user.clerk_user_id || null,
      },
    });
  } catch (error) {
    console.error("Shared auth bootstrap error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to bootstrap shared user" });
  }
});

app.post("/api/auth/unity-logout", (req, res) => {
  clearSharedUserCookie(req, res);
  return res.json({ success: true });
});

app.post("/api/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Missing data",
        message: "Token and new password are required.",
      });
    }

    const [users] = await pool.query(
      "SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token],
    );

    const user = users[0];

    if (!user) {
      return res.status(400).json({
        error: "Invalid token",
        message: "Token is invalid or expired.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [hashedPassword, user.id],
    );

    return res.json({
      message: "Password has been reset. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      error: "Server error",
      message: "Unable to reset password right now.",
    });
  }
});

// ... (Get user profile endpoint) ...
// User Profile Endpoints
// GET profile
app.get("/api/profile", requireUnityUser, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT profile (update)
app.put("/api/profile", requireUnityUser, async (req, res) => {
  try {
    const fields = req.body;
    const allowed = [
      "name",
      "display_name",
      "avatar",
      "profile_image",
      "ageRange",
      "bio",
      "isAnonymous",
      "emergency_contact",
      "notificationPrefs",
      "goals",
      "profileVisibility",
    ];
    const updates = [];
    const values = [];
    allowed.forEach((key) => {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    });
    if (!updates.length)
      return res.status(400).json({ error: "No fields to update" });
    values.push(req.user.id);
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// DELETE profile (account deletion)
app.delete("/api/profile", requireUnityUser, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Download profile data
app.get("/api/profile/download", requireUnityUser, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="unitywithin-profile.json"',
    );
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(user, null, 2));
  } catch (error) {
    res.status(500).json({ error: "Failed to download profile data" });
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tryParseJson = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch (innerError) {
        return null;
      }
    }
    return null;
  }
};

const buildPrompt = (prompt, json) => {
  if (!json) return prompt;
  return `${prompt}\n\nReturn ONLY valid JSON. Do not wrap in markdown.`;
};

const createTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timeoutId) };
};

const callOpenAICompatible = async (
  client,
  modelName,
  prompt,
  systemInstruction,
  json,
) => {
  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: buildPrompt(prompt, json) },
    ],
    response_format: json ? { type: "json_object" } : undefined,
  });

  const text = response.choices?.[0]?.message?.content || "";
  if (!json) return text;

  const parsed = tryParseJson(text);
  if (!parsed) throw new Error("Invalid JSON from provider");
  return parsed;
};

// Core AI Calling Helper with Robustness
const callAI = async (
  prompt,
  systemInstruction = SYSTEM_INSTRUCTION,
  options = {},
) => {
  const { retries = AI_RETRIES, delay = 500, json = false } = options;

  // 1. Try OpenAI
  if (openai) {
    let currentDelay = delay;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await openai.chat.completions.create({
          model: aiConfig.openai.model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: buildPrompt(prompt, json) },
          ],
          response_format: json ? { type: "json_object" } : undefined,
        });
        const text = response.choices?.[0]?.message?.content || "";
        if (!json) return text;

        const parsed = tryParseJson(text);
        if (!parsed) throw new Error("Invalid JSON from provider");
        return parsed;
      } catch (error) {
        const status = error?.status;
        const message = error?.message || "";
        const isRateLimit = status === 429 || message.includes("429");
        const isRetryable = isRateLimit || status === 503 || status === 504;
        if (isRetryable && i < retries - 1) {
          console.warn(
            `⏳ OpenAI rate limit/unavailable (Attempt ${i + 1}). Retrying in ${currentDelay}ms...`,
          );
          await sleep(currentDelay);
          currentDelay *= 2;
        } else {
          console.error("❌ OpenAI fallback error:", message);
          break;
        }
      }
    }
  }

  // 2. Try Groq fallback
  if (groq) {
    let currentDelay = delay;
    for (let i = 0; i < retries; i++) {
      try {
        return await callOpenAICompatible(
          groq,
          GROQ_MODEL,
          prompt,
          systemInstruction,
          json,
        );
      } catch (error) {
        const status = error?.status;
        const message = error?.message || "";
        const isRateLimit = status === 429 || message.includes("429");
        const isRetryable = isRateLimit || status === 503 || status === 504;
        if (isRetryable && i < retries - 1) {
          console.warn(
            `⏳ Groq rate limit/unavailable (Attempt ${i + 1}). Retrying in ${currentDelay}ms...`,
          );
          await sleep(currentDelay);
          currentDelay *= 2;
        } else {
          console.error("❌ Groq fallback error:", message);
          break;
        }
      }
    }
  }

  return null;
};

const hasUsefulAiText = (value) => {
  return typeof value === "string" && value.trim().length > 5;
};

const ROUTER_TIMEOUT_MS = 8000;

const withTimeout = async (promise) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ROUTER_TIMEOUT_MS),
    ),
  ]);
};

const getAIResponse = async (prompt) => {
  const cleanPrompt = toSafeText(prompt);
  if (!cleanPrompt) {
    return AI_UNREACHABLE_MESSAGE;
  }

  const providers = [
    {
      name: "OpenAI",
      call: async () => {
        if (!openai) throw new Error("OPENAI_API_KEY not configured");

        const res = await openai.chat.completions.create({
          model: aiConfig.openai.model,
          messages: [{ role: "user", content: cleanPrompt }],
        });

        return res.choices?.[0]?.message?.content || "";
      },
    },
    {
      name: "Groq",
      call: async () => {
        if (!groq) throw new Error("GROQ_API_KEY not configured");

        const res = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: cleanPrompt }],
        });

        return res?.choices?.[0]?.message?.content || "";
      },
    },
  ];

  for (const provider of providers) {
    try {
      console.log(`🤖 Trying ${provider.name}`);
      const response = await withTimeout(provider.call());
      if (hasUsefulAiText(response)) {
        console.log(`✅ ${provider.name} succeeded`);
        return response.trim();
      }
    } catch (error) {
      console.log(`❌ ${provider.name} failed:`, error?.message || error);
    }
  }

  return AI_UNREACHABLE_MESSAGE;
};

// Helper for AI Moderation
const moderateContent = async (text) => {
  const prompt = `
    Task: Moderate this chat message for a mental health support platform for youth.
    Message: "${text}"
    
    Rules:
    1. Flag as 'UNSAFE' if it contains: Hate speech, severe bullying, explicit sexual content, or encouragement of self-harm.
    2. Flag as 'CRISIS' if it contains: Clear intent of suicide, self-harm, or immediate danger to self/others.
    3. Otherwise, return 'SAFE'.
    
    Output format: Just one word: SAFE, UNSAFE, or CRISIS.
    `;

  const status = await callAI(prompt, "You are a content moderator.");

  if (status) {
    const upperStatus = status.trim().toUpperCase();
    if (upperStatus.includes("CRISIS"))
      return { safe: false, reason: "CRISIS" };
    if (upperStatus.includes("UNSAFE"))
      return { safe: false, reason: "UNSAFE" };
  }

  // Default to safe if AI fails to give clear answer
  return { safe: true };
};

// Socket.io Connection
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("register", async (rawUserId) => {
    const userId = Number(rawUserId || 0);
    if (!userId) return;

    markUserSocketOnline(socket.id, userId);

    try {
      const [unreadRows] = await pool.query(
        `SELECT id, user_id, session_id, type, title, message, payload, channel, is_read, created_at
                 FROM support_notifications
                 WHERE user_id = ? AND is_read = ?
                 ORDER BY created_at DESC
                 LIMIT 50`,
        [userId, false],
      );

      const unread = (unreadRows || []).map((row) => ({
        id: row.id,
        userId: Number(row.user_id),
        sessionId: row.session_id ? Number(row.session_id) : null,
        type: row.type,
        title: row.title,
        message: row.message,
        payload: (() => {
          try {
            return row.payload ? JSON.parse(row.payload) : null;
          } catch {
            return null;
          }
        })(),
        channel: row.channel || "in_app",
        isRead: Boolean(row.is_read),
        createdAt: row.created_at,
      }));

      socket.emit("notification:sync", { unread });
    } catch (error) {
      console.error("Notification sync error:", error);
    }
  });

  socket.on("therapist_presence_join", (payload) => {
    const therapistId = Number(payload?.therapistId);
    if (!therapistId) return;
    markTherapistSocketOnline(socket.id, therapistId);
  });

  socket.on("therapist_presence_leave", () => {
    markTherapistSocketOffline(socket.id);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("join_event", async (payload) => {
    const eventId = Number(payload?.eventId || payload);
    const userId = Number(payload?.userId || 0);

    if (!eventId || !userId) {
      socket.emit("event_access_denied", { reason: "Invalid event context." });
      return;
    }

    try {
      const [rows] = await pool.query(
        `SELECT id
                 FROM rsvps
                 WHERE user_id = ? AND event_id = ? AND status = 'yes'
                 LIMIT 1`,
        [userId, eventId],
      );

      if (!rows?.length) {
        socket.emit("event_access_denied", {
          reason: "RSVP YES is required before joining event chat.",
        });
        return;
      }

      const roomKey = `event_${eventId}`;
      socket.join(roomKey);
      socket.emit("event_joined", { eventId });
    } catch (error) {
      console.error("Join event socket error:", error);
      socket.emit("event_access_denied", {
        reason: "Unable to join event room right now.",
      });
    }
  });

  socket.on("event_message", async (payload) => {
    const eventId = Number(payload?.eventId || 0);
    const userId = Number(payload?.userId || 0);
    const message = toSafeText(payload?.message);

    if (!eventId || !userId || !message) {
      socket.emit("event_message_rejected", {
        reason: "Invalid event message payload.",
      });
      return;
    }

    try {
      const [rsvpRows] = await pool.query(
        `SELECT id
                 FROM rsvps
                 WHERE user_id = ? AND event_id = ? AND status = 'yes'
                 LIMIT 1`,
        [userId, eventId],
      );

      if (!rsvpRows?.length) {
        socket.emit("event_message_rejected", {
          reason: "RSVP YES is required before chatting.",
        });
        return;
      }

      const [result] = await pool.query(
        "INSERT INTO event_messages (event_id, user_id, message) VALUES (?, ?, ?)",
        [eventId, userId, message],
      );

      const roomKey = `event_${eventId}`;
      io.to(roomKey).emit("event_message", {
        id: result.insertId,
        event_id: eventId,
        user_id: userId,
        message,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Event message socket error:", error);
      socket.emit("event_message_rejected", {
        reason: "Unable to send message right now.",
      });
    }
  });

  socket.on("send_message", async (data) => {
    // data: { roomId, userId, content, isAnonymous }
    const roomId = Number(data?.roomId);
    const userId =
      typeof data?.userId === "number" && Number.isFinite(data.userId)
        ? data.userId
        : null;
    const content =
      typeof data?.content === "string" ? data.content.trim() : "";
    const isAnonymous = Boolean(data?.isAnonymous);

    if (!roomId || !content) {
      socket.emit("message_rejected", {
        reason: "Message is empty or room is invalid.",
      });
      return;
    }

    // 1. Basic Word Filter (Fast check)
    const badWords = ["badword", "abuse", "hate"];
    const lowerContent = content.toLowerCase();
    if (badWords.some((word) => lowerContent.includes(word))) {
      console.log(`Message filtered (Basic): ${content}`);
      socket.emit("message_rejected", { reason: "Contains prohibited words." });
      return;
    }

    // 2. AI Moderation (Deep check)
    let moderation = { safe: true };
    try {
      moderation = await moderateContent(content);
    } catch (moderationError) {
      console.error(
        "Moderation failed, defaulting to safe:",
        moderationError?.message || moderationError,
      );
    }
    if (!moderation.safe) {
      console.log(`Message filtered (AI - ${moderation.reason}): ${content}`);

      // Log to database
      try {
        await pool.query(
          "INSERT INTO moderation_logs (user_id, content, reason, flag_type, ip_address) VALUES (?, ?, ?, ?, ?)",
          [
            userId,
            content,
            "AI Detection",
            moderation.reason,
            socket.handshake.address,
          ],
        );
      } catch (logLimit) {
        console.error("Failed to log moderation event:", logLimit);
      }

      if (moderation.reason === "CRISIS") {
        socket.emit("message_rejected", {
          reason:
            "Your message indicates you might be in distress. We care about you. Please use the Crisis Shield button (bottom right) to connect with support immediately.",
          isCrisis: true,
        });
      } else {
        socket.emit("message_rejected", {
          reason: "This message does not meet our community safety guidelines.",
        });
      }
      return;
    }

    // Save to DB
    const messageData = {
      id: `temp-${Date.now()}`,
      room_id: roomId,
      user_id: userId,
      content,
      is_anonymous: isAnonymous,
      created_at: new Date(),
      user_name: isAnonymous ? null : data?.userName || "User",
    };

    try {
      const [result] = await pool.query(
        "INSERT INTO chat_messages (room_id, user_id, content, is_anonymous) VALUES (?, ?, ?, ?)",
        [roomId, userId, content, isAnonymous],
      );

      messageData.id = result.insertId;

      io.to(roomId).emit("receive_message", messageData);
    } catch (err) {
      console.error("Error saving socket message:", err);
      io.to(roomId).emit("receive_message", messageData);
    }
  });

  socket.on("join_support_session", async (sessionId) => {
    const roomKey = `support_session_${Number(sessionId)}`;
    socket.join(roomKey);
    console.log(`User ${socket.id} joined support session ${sessionId}`);

    // Notify anyone already in the room that a participant has joined
    io.to(roomKey).emit("support_participant_joined", {
      sessionId: Number(sessionId),
      socketId: socket.id,
    });

    try {
      const participantCount = io.sockets.adapter.rooms.get(roomKey)?.size || 0;
      if (participantCount < 2) {
        return;
      }

      const parsedSessionId = Number(sessionId);
      if (!parsedSessionId) return;

      const [rows] = await pool.query(
        "SELECT id, therapist_id, user_id, call_mode, status FROM support_sessions WHERE id = ? LIMIT 1",
        [parsedSessionId],
      );
      const session = rows?.[0];
      if (!session) return;

      const normalizedStatus = normalizeSupportStatus(session.status, "new");
      if (
        !["confirmed", "live", "accepted", "in_progress"].includes(
          normalizedStatus,
        )
      ) {
        return;
      }

      if (normalizedStatus !== "in_progress") {
        await pool.query(
          "UPDATE support_sessions SET status = ?, start_time = COALESCE(start_time, NOW()) WHERE id = ?",
          ["in_progress", parsedSessionId],
        );
      }

      io.to(roomKey).emit("support_session_started", {
        sessionId: parsedSessionId,
        therapistId: Number(session.therapist_id) || null,
        userId: Number(session.user_id) || null,
        callMode:
          String(session.call_mode || "voice").toLowerCase() === "video"
            ? "video"
            : "voice",
        message: "Session is now in progress",
      });

      await emitNotificationToUser({
        userId: Number(session.user_id) || null,
        sessionId: parsedSessionId,
        type: "support_session_started",
        title: resolveNotificationTitle("support_session_started"),
        message: "Session is now in progress",
        payload: {
          therapistId: Number(session.therapist_id) || null,
          callMode:
            String(session.call_mode || "voice").toLowerCase() === "video"
              ? "video"
              : "voice",
        },
        eventKey: `session:${parsedSessionId}:started:user`,
      });

      const [therapistRows] = await pool.query(
        "SELECT user_id FROM therapists WHERE id = ? LIMIT 1",
        [session.therapist_id],
      );
      await emitNotificationToUser({
        userId: Number(therapistRows?.[0]?.user_id || 0) || null,
        sessionId: parsedSessionId,
        type: "support_session_started",
        title: resolveNotificationTitle("support_session_started"),
        message: "Client has joined. Session is in progress",
        payload: {
          therapistId: Number(session.therapist_id) || null,
          callMode:
            String(session.call_mode || "voice").toLowerCase() === "video"
              ? "video"
              : "voice",
        },
        eventKey: `session:${parsedSessionId}:started:therapist`,
      });

      io.emit("support_session_status_changed", {
        sessionId: parsedSessionId,
        status: "ongoing",
        therapistId: Number(session.therapist_id) || null,
        userId: Number(session.user_id) || null,
      });
    } catch (error) {
      console.error("Join support session automation error:", error);
    }
  });

  socket.on("support_send_message", async (data) => {
    const sessionId = Number(data?.sessionId);
    const content =
      typeof data?.content === "string" ? data.content.trim() : "";
    const senderRole = data?.senderRole === "therapist" ? "therapist" : "user";
    const senderName =
      toSafeText(data?.senderName) ||
      (senderRole === "therapist" ? "Therapist" : "User");
    const attachmentName = toSafeText(data?.attachmentName) || null;

    if (!sessionId || !content) {
      socket.emit("support_message_rejected", {
        reason: "Message is empty or session is invalid.",
      });
      return;
    }

    const roomKey = `support_session_${sessionId}`;
    const messageData = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender_role: senderRole,
      sender_name: senderName,
      content,
      attachment_name: attachmentName,
      created_at: new Date().toISOString(),
    };

    try {
      const [result] = await pool.query(
        `INSERT INTO support_session_messages (session_id, sender_role, sender_name, content, attachment_name)
                 VALUES (?, ?, ?, ?, ?)`,
        [sessionId, senderRole, senderName, content, attachmentName],
      );

      messageData.id = result.insertId;
      io.to(roomKey).emit("support_receive_message", messageData);
    } catch (error) {
      console.error("Support socket message save error:", error);
      io.to(roomKey).emit("support_receive_message", messageData);
    }
  });

  socket.on("disconnect", () => {
    markTherapistSocketOffline(socket.id);
    markUserSocketOffline(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

// Chat Endpoints
app.get("/api/chat/rooms", async (req, res) => {
  try {
    let [rows] = await pool.query("SELECT * FROM chat_rooms ORDER BY name ASC");
    if (!rows || rows.length === 0) {
      await ensureDefaultRoomsSeeded();
      [rows] = await pool.query("SELECT * FROM chat_rooms ORDER BY name ASC");
    }
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.get("/api/chat/rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    // PRIVACY FIX: Only return user_name if is_anonymous is FALSE (0).
    // If is_anonymous is TRUE (1), return NULL or 'Anonymous'.
    const [rows] = await pool.query(
      `
            SELECT m.id, m.content, m.created_at, m.is_anonymous, m.user_id, 
            CASE WHEN m.is_anonymous = TRUE THEN NULL ELSE u.name END as user_name
            FROM chat_messages m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.room_id = ?
            ORDER BY m.created_at ASC
            LIMIT 50
        `,
      [roomId],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { userId, messageId, reason } = req.body;
    await pool.query(
      "INSERT INTO reports (user_id, message_id, reason) VALUES (?, ?, ?)",
      [userId, messageId, reason],
    );
    res.json({ success: true, message: "Report submitted" });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

const normalizeTherapistStatus = (value, fallback = "pending") => {
  const raw = (value || "").toString().trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "approved" || raw === "active") return "approved";
  if (raw === "pending" || raw === "inactive") return "pending";
  return fallback;
};

const sanitizeWhatsAppPhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0") && digits.length >= 10)
    return `254${digits.slice(1)}`;
  return digits;
};

const toEventSlug = (value = "") => {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 160) || `event-${Date.now()}`
  );
};

const buildEventPublicLink = (req, slug) => {
  const configuredBase = (
    process.env.EVENTS_APP_BASE_URL ||
    process.env.APPSETTING_EVENTS_APP_BASE_URL ||
    ""
  )
    .toString()
    .trim();
  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, "")}/${slug}`;
  }

  const forwardedProto = (req.headers["x-forwarded-proto"] || "")
    .toString()
    .split(",")[0]
    .trim();
  const forwardedHost = (req.headers["x-forwarded-host"] || "")
    .toString()
    .split(",")[0]
    .trim();
  const requestHost = (forwardedHost || req.get("host") || "").replace(
    /\/$/,
    "",
  );
  const bareHost = requestHost.split(":")[0].toLowerCase();
  const protocol = forwardedProto || req.protocol || "https";

  const isLocal = bareHost === "localhost" || bareHost === "127.0.0.1";
  const isUnityDomain =
    bareHost === "unitywithin.app" || bareHost.endsWith(".unitywithin.app");
  const canonicalProtocol = isUnityDomain ? "https" : protocol;
  const canonicalHost = isLocal
    ? requestHost
    : isUnityDomain
      ? "unitywithin.app/events"
      : requestHost || "unitywithin.app/events";

  return `${canonicalProtocol}://${canonicalHost}/${slug}`;
};

const resolveCanonicalEventsBase = (req) => {
  const configuredBase = (
    process.env.EVENTS_APP_BASE_URL ||
    process.env.APPSETTING_EVENTS_APP_BASE_URL ||
    ""
  )
    .toString()
    .trim();
  if (configuredBase) {
    return configuredBase.replace(/\/$/, "");
  }

  const forwardedProto = (req.headers["x-forwarded-proto"] || "")
    .toString()
    .split(",")[0]
    .trim();
  const protocol = forwardedProto || req.protocol || "https";
  const hostHeader = String(
    req.headers["x-forwarded-host"] || req.headers.host || "",
  )
    .split(",")[0]
    .trim();
  const host = hostHeader.split(":")[0].toLowerCase();

  if (host === "localhost" || host === "127.0.0.1") {
    return `${protocol}://${hostHeader}`;
  }

  if (host === "unitywithin.app" || host.endsWith(".unitywithin.app")) {
    return `https://unitywithin.app/events`;
  }

  return `${protocol}://${hostHeader || "unitywithin.app/events"}`;
};

const MAIN_APP_RESERVED_PATHS = new Set([
  "dashboard",
  "toolkit",
  "chat",
  "community",
  "journal",
  "breathe",
  "education",
  "admin",
  "namethefeeling",
  "selfcompassion",
  "values",
  "bodyscan",
  "safespace",
  "reframer",
  "profile",
  "support",
  "landingpage",
  "signup",
  "sign-up",
  "login",
  "sign-in",
  "sso-callback",
  "therapist-login",
  "therapist-portal",
  "therapist-invite",
  "forgot-password",
  "reset-password",
  "why-unity",
  "privacy",
  "api",
]);

const buildTherapistInviteEmail = ({ inviteLink }) => `
  <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2 style="margin-bottom: 8px;">You've been invited to join Unity Within 💛</h2>
    <p>You're receiving this invite because an administrator selected you for therapist onboarding.</p>
    <p>
      Continue your onboarding here:<br />
      <a href="${inviteLink}">${inviteLink}</a>
    </p>
    <p>This secure link expires in 3 days.</p>
    <p>If you were not expecting this invite, you can ignore this email.</p>
  </div>
`;

const sendBrevoEmail = async ({ toEmail, subject, htmlContent }) => {
  if (!toEmail) return { sent: false, reason: "missing-recipient" };

  const result = await sendEmail(toEmail, subject, htmlContent);
  return {
    sent: Boolean(result?.success),
    reason: result?.success ? null : result?.error || "send-failed",
  };
};

// Admin creates a therapist invite and gets both invite URL + WhatsApp deep-link.
app.post("/api/admin/invite-volunteer", requireAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, error: "Email is required" });

  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      "INSERT INTO volunteer_invites (email, token, expires_at) VALUES (?, ?, ?)",
      [email, token, expiresAt],
    );

    const inviteLink = `${getAppBaseUrl(req)}/join?ref=${token}&e=${encodeURIComponent(email)}`;

    const emailSent = await sendVolunteerInvite(email, inviteLink);

    res.json({ success: true, inviteLink, emailSent: emailSent.success });
  } catch (error) {
    console.error("❌ Invite volunteer error:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

app.post("/api/admin/send-email", requireAdmin, async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: "Recipient, subject, and message are required",
    });
  }

  try {
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                <h2 style="color: #6d28d9;">Message from Unity Within</h2>
                <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">
                    ${message}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #999;">Unity Within - Empathy. Community. Healing.</p>
            </div>
        `;
    const result = await sendEmail(to, subject, html);
    res.json(result);
  } catch (error) {
    console.error("❌ Custom email error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/push/public-key", (req, res) => {
  const publicKey =
    process.env.VITE_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    process.env.APPSETTING_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(404).json({ error: "VAPID public key not configured" });
  }
  res.json({ publicKey });
});

app.get("/api/admin/volunteers", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT v.*, r.title as role_title 
            FROM volunteers v 
            LEFT JOIN volunteer_roles r ON v.matched_role_id = r.id 
            ORDER BY v.created_at DESC
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/admin/volunteer-stats", requireAdmin, async (req, res) => {
  try {
    const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending
            FROM volunteers
        `);
    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/volunteer/invite/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT email FROM volunteer_invites WHERE token = ? AND expires_at > NOW() AND status = ?",
      [token, "pending"],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Invalid or expired token" });
    res.json({ success: true, email: rows[0].email });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/volunteer/roles", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM volunteer_roles");
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/volunteer/onboarding", async (req, res) => {
  const {
    token,
    name,
    email,
    phone,
    county,
    skills,
    matched_role_id,
    commitment_level,
    tier,
  } = req.body;
  try {
    // Validate token again
    const [invites] = await pool.query(
      "SELECT id FROM volunteer_invites WHERE token = ? AND status = ?",
      [token, "pending"],
    );
    if (invites.length === 0)
      return res.status(400).json({ success: false, error: "Invalid token" });

    // Cross-dialect upsert: check if volunteer exists, then insert or update
    const [existingVols] = await pool.query(
      "SELECT id FROM volunteers WHERE email = ? LIMIT 1",
      [email],
    );
    if (existingVols && existingVols.length > 0) {
      await pool.query(
        `UPDATE volunteers SET name = ?, phone = ?, county = ?, skills = ?, 
                 matched_role_id = ?, commitment_level = ?, tier = ?, status = 'pending_review' 
                 WHERE email = ?`,
        [
          name,
          phone,
          county,
          JSON.stringify(skills),
          matched_role_id,
          commitment_level,
          tier,
          email,
        ],
      );
    } else {
      await pool.query(
        `INSERT INTO volunteers (name, email, phone, county, skills, matched_role_id, commitment_level, tier, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          email,
          phone,
          county,
          JSON.stringify(skills),
          matched_role_id,
          commitment_level,
          tier,
          "pending_review",
        ],
      );
    }

    await pool.query(
      "UPDATE volunteer_invites SET status = ? WHERE token = ?",
      ["accepted", token],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Onboarding error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/volunteer/dashboard", async (req, res) => {
  const email = req.headers["x-user-email"];
  if (!email)
    return res.status(401).json({ success: false, error: "Unauthorized" });

  try {
    const [volunteers] = await pool.query(
      "SELECT * FROM volunteers WHERE email = ?",
      [email],
    );
    if (volunteers.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Volunteer not found" });

    const volunteer = volunteers[0];
    const [tasks] = await pool.query(
      "SELECT * FROM volunteer_tasks WHERE volunteer_id = ? ORDER BY due_date ASC",
      [volunteer.id],
    );
    const [training] = await pool.query(
      "SELECT * FROM volunteer_training WHERE volunteer_id = ?",
      [volunteer.id],
    );
    const [shifts] = await pool.query(
      "SELECT * FROM volunteer_shifts WHERE volunteer_id = ? ORDER BY start_time ASC",
      [volunteer.id],
    );

    res.json({
      success: true,
      data: {
        profile: volunteer,
        tasks,
        training,
        shifts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/invite-therapist", requireAdmin, async (req, res) => {
  try {
    const email = (req.body?.email || "").toString().trim().toLowerCase();
    const phoneRaw = (req.body?.phone || "").toString().trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, error: "A valid email is required" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const appBaseUrl = (
      process.env.APP_BASE_URL ||
      process.env.RESET_PASSWORD_BASE_URL ||
      "https://unitywithin.app"
    ).replace(/\/$/, "");
    const inviteLink = `${appBaseUrl}/therapist-invite/${token}`;

    await pool.query(
      `INSERT INTO therapist_invites (email, phone, token, status, expires_at)
             VALUES (?, ?, ?, 'pending', NOW() + INTERVAL 3 DAY)`,
      [email, phoneRaw || null, token],
    );

    const emailResult = await sendTherapistInvite(email, inviteLink);
    const emailSent = emailResult.success;
    const emailErrorMessage = emailSent
      ? null
      : emailResult.error || "Email delivery failed";

    const sanitizedPhone = sanitizeWhatsAppPhone(phoneRaw);
    const whatsappMessage = encodeURIComponent(
      `Hello 👋\n\nYou have been invited to join Unity Within as a therapist 💛\n\nStart here:\n${inviteLink}\n\n⚠️ This link expires in 3 days.`,
    );

    const whatsappUrl = sanitizedPhone
      ? `https://wa.me/${sanitizedPhone}?text=${whatsappMessage}`
      : null;

    return res.status(201).json({
      success: true,
      inviteLink,
      whatsappUrl,
      emailSent,
      emailError: emailSent ? null : emailErrorMessage,
    });
  } catch (error) {
    console.error("Create therapist invite error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create therapist invite" });
  }
});

app.get("/api/invite/:token", async (req, res) => {
  try {
    const token = (req.params?.token || "").toString().trim();
    if (!token) {
      return res.status(400).json({ success: false, error: "Invalid link" });
    }

    const [rows] = await pool.query(
      `SELECT id, email, phone, token, status, expires_at, created_at
             FROM therapist_invites
             WHERE token = ?
             LIMIT 1`,
      [token],
    );

    const invite = rows?.[0];
    if (!invite) {
      return res.status(400).json({ success: false, error: "Invalid link" });
    }

    if (normalizeTherapistStatus(invite.status) !== "pending") {
      return res.status(400).json({ success: false, error: "Already used" });
    }

    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ success: false, error: "Expired link" });
    }

    return res.json({
      success: true,
      invite: {
        email: invite.email,
        phone: invite.phone,
        expiresAt: invite.expires_at,
        status: invite.status,
      },
    });
  } catch (error) {
    console.error("Verify therapist invite error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to verify invite" });
  }
});

app.post("/api/invite/complete", async (req, res) => {
  try {
    const token = (req.body?.token || "").toString().trim();
    const password = (req.body?.password || "").toString();
    const name = (req.body?.name || "").toString().trim();
    const specialization = (req.body?.specialization || "").toString().trim();
    const bio = (req.body?.bio || "").toString().trim();
    const languages = (req.body?.languages || "English, Swahili")
      .toString()
      .trim();

    if (!token || !password || !name || !specialization || !bio) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    const [inviteRows] = await pool.query(
      `SELECT id, email, phone, status, expires_at
             FROM therapist_invites
             WHERE token = ?
             LIMIT 1`,
      [token],
    );

    const invite = inviteRows?.[0];
    if (!invite) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid invite token" });
    }

    if (normalizeTherapistStatus(invite.status) !== "pending") {
      return res
        .status(400)
        .json({ success: false, error: "Invite has already been used" });
    }

    if (new Date() > new Date(invite.expires_at)) {
      return res
        .status(400)
        .json({ success: false, error: "Invite has expired" });
    }

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [invite.email],
    );
    if (existingUsers?.length) {
      return res.status(409).json({
        success: false,
        error: "A user with this email already exists",
      });
    }

    const [existingTherapists] = await pool.query(
      "SELECT id FROM therapists WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [invite.email],
    );
    if (existingTherapists?.length) {
      return res.status(409).json({
        success: false,
        error: "A therapist profile for this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [userInsert] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
             VALUES (?, ?, ?, 'therapist')`,
      [name, invite.email, passwordHash],
    );

    const userId = userInsert?.insertId;
    await pool.query(
      `INSERT INTO therapists (user_id, name, email, phone, password_hash, specialization, bio, languages, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        name,
        invite.email,
        invite.phone || "",
        passwordHash,
        specialization,
        bio,
        languages || "English, Swahili",
      ],
    );

    await pool.query(
      `UPDATE therapist_invites
             SET status = 'accepted', accepted_at = NOW()
             WHERE id = ?`,
      [invite.id],
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Complete therapist invite error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to complete invite onboarding" });
  }
});

// Support Endpoints
// Therapist's own profile endpoint
app.get("/api/support/therapists/profile/self", async (req, res) => {
  try {
    const therapistIdFromHeader = await resolveTherapistIdFromHeaders(
      req.headers,
    );

    if (!therapistIdFromHeader) {
      return res.status(401).json({
        success: false,
        error: "Missing therapist context. Please log in as a therapist.",
      });
    }

    const [rows] = await pool.query(
      `SELECT id, name, photo, email, phone, specialization, bio, qualifications, experience, 
                    languages, availability, availability_schedule, session_price, rating, status, created_at
             FROM therapists
             WHERE id = ?
             LIMIT 1`,
      [therapistIdFromHeader],
    );

    if (!rows?.length) {
      return res.status(404).json({
        success: false,
        error: "Therapist profile not found",
      });
    }

    const therapist = rows[0];
    return res.json({
      success: true,
      data: {
        id: Number(therapist.id),
        name: therapist.name,
        photo: therapist.photo || null,
        email: therapist.email || "",
        phone: therapist.phone || "",
        specialization: therapist.specialization || "",
        bio: therapist.bio || "",
        qualifications: therapist.qualifications || "",
        experience: therapist.experience || "1+ years",
        languages: therapist.languages || "English, Swahili",
        availability: therapist.availability || "online",
        availabilitySchedule: therapist.availability_schedule || "",
        sessionPrice: therapist.session_price || "$5 chat / $10 video",
        rating: Number(therapist.rating) || 4.5,
        status: therapist.status || "pending",
        createdAt: therapist.created_at,
      },
    });
  } catch (error) {
    console.error("Fetch therapist profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch therapist profile",
    });
  }
});

app.get("/api/support/therapists", async (req, res) => {
  try {
    const { specialization, language, availability, rating } = req.query;
    const where = [];
    const params = [];

    if (specialization) {
      where.push("LOWER(specialization) LIKE LOWER(?)");
      params.push(`%${specialization}%`);
    }

    if (language) {
      where.push("LOWER(languages) LIKE LOWER(?)");
      params.push(`%${language}%`);
    }

    if (availability) {
      where.push("LOWER(availability) LIKE LOWER(?)");
      params.push(`%${availability}%`);
    }

    if (rating && !Number.isNaN(Number(rating))) {
      where.push("rating >= ?");
      params.push(Number(rating));
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT id, name, photo, email, phone, specialization, bio, qualifications, experience, languages, availability, availability_schedule, session_price, rating, status, created_at
             FROM therapists
             ${whereClause}
             ORDER BY rating DESC, created_at DESC`,
      params,
    );

    const enriched = (rows || []).map((item) => ({
      ...item,
      is_online: isTherapistOnline(item.id),
    }));

    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Support therapists error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch therapists" });
  }
});

app.get("/api/support/therapists/:id", async (req, res) => {
  try {
    const therapistId = Number(req.params.id);
    if (!therapistId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid therapist id" });
    }

    const [rows] = await pool.query(
      `SELECT id, name, photo, email, phone, specialization, bio, qualifications, experience, languages, availability, availability_schedule, session_price, rating, status, created_at
             FROM therapists
             WHERE id = ?
             LIMIT 1`,
      [therapistId],
    );

    if (!rows?.length) {
      return res
        .status(404)
        .json({ success: false, error: "Therapist not found" });
    }

    return res.json({
      success: true,
      data: {
        ...rows[0],
        is_online: isTherapistOnline(rows[0].id),
      },
    });
  } catch (error) {
    console.error("Support therapist profile error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch therapist profile" });
  }
});

app.get("/api/support/presence", async (_req, res) => {
  return res.json({
    success: true,
    onlineTherapistIds: getOnlineTherapistIds(),
  });
});

app.get("/api/support/therapist-context", async (req, res) => {
  try {
    const therapistId = await resolveTherapistIdFromHeaders(req.headers);
    if (!therapistId) {
      return res.status(404).json({
        success: false,
        error: "Therapist profile not found for current account",
      });
    }

    return res.json({
      success: true,
      data: {
        therapistId,
        isOnline: isTherapistOnline(therapistId),
      },
    });
  } catch (error) {
    console.error("Support therapist context error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to resolve therapist context" });
  }
});

app.get("/api/support/users/:userId/sessions/active", async (req, res) => {
  try {
    const userId = Number(req.params.userId || req.headers["x-user-id"]);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "Valid user id is required" });
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.user_id, s.therapist_id, s.call_mode, s.status, s.scheduled_date, s.scheduled_time, s.start_time,
                    t.name AS therapist_name
             FROM support_sessions s
             LEFT JOIN therapists t ON t.id = s.therapist_id
             WHERE s.user_id = ?
               AND s.status IN ('new', 'pending', 'accepted', 'confirmed', 'live', 'in_progress', 'ongoing')
             ORDER BY s.created_at DESC
             LIMIT 1`,
      [userId],
    );

    const session = rows?.[0];
    if (!session) {
      return res.json({ success: true, data: null });
    }

    const joinState = getJoinStateForSession(session);
    return res.json({
      success: true,
      data: {
        id: Number(session.id),
        userId: Number(session.user_id) || null,
        therapistId: Number(session.therapist_id) || null,
        therapistName: session.therapist_name || "Therapist",
        sessionType:
          String(session.call_mode || "voice").toLowerCase() === "video"
            ? "video"
            : "audio",
        status: normalizeSupportLifecycleStatus(session.status, "new"),
        scheduledTime: joinState.startsAt,
        joinEnabled: Boolean(joinState.joinEnabled),
        minutesToStart: joinState.minutesToStart,
      },
    });
  } catch (error) {
    console.error("Support active session fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch active support session",
    });
  }
});

app.post("/api/sessions/book", async (req, res) => {
  try {
    const therapistId = Number(req.body?.therapistId);
    const userId = Number(req.body?.userId || req.headers["x-user-id"]);
    const date = (req.body?.date || "").toString().trim();
    const time = (req.body?.time || "").toString().trim();
    const preferredTimeFrame = (req.body?.preferredTimeFrame || "")
      .toString()
      .trim();
    const type = (req.body?.type || "").toString().trim().toLowerCase();
    const callMode = type === "video" ? "video" : "voice";

    // Client intake fields
    const clientName = (req.body?.clientName || "").toString().trim();
    const clientPhone = (req.body?.phone || "").toString().trim();
    const clientAge = (req.body?.age || "").toString().trim();
    const clientEmail = (req.body?.email || "").toString().trim();
    const issueDescription = (req.body?.issueDescription || "")
      .toString()
      .trim();

    if (
      !therapistId ||
      !userId ||
      !date ||
      !time ||
      !["video", "voice"].includes(callMode)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "therapistId, userId, date, time, and type(video|voice) are required",
      });
    }

    const [therapistRows] = await pool.query(
      "SELECT id, name, email, user_id FROM therapists WHERE id = ? LIMIT 1",
      [therapistId],
    );
    if (!therapistRows?.length) {
      return res
        .status(404)
        .json({ success: false, error: "Therapist not found" });
    }

    const [userRows] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    if (!userRows?.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Prevent duplicate overlapping sessions with the same therapist until current one is finished.
    const [activeRows] = await pool.query(
      `SELECT id, status
             FROM support_sessions
             WHERE user_id = ?
               AND therapist_id = ?
                             AND status IN ('new', 'pending', 'in_progress', 'ongoing')
             ORDER BY created_at DESC
             LIMIT 1`,
      [userId, therapistId],
    );

    if (activeRows?.length) {
      return res.status(409).json({
        success: false,
        error:
          "You already have an active request/session with this therapist. Finish it before booking another one.",
      });
    }

    const [insertResult] = await pool.query(
      `INSERT INTO support_sessions (user_id, therapist_id, type, call_mode, status, priority, scheduled_date, scheduled_time, preferred_timeframe, client_name, client_phone, client_age, client_email, issue_description)
             VALUES (?, ?, 'call', ?, 'new', 'normal', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        therapistId,
        callMode,
        date,
        time,
        preferredTimeFrame || null,
        clientName || null,
        clientPhone || null,
        clientAge || null,
        clientEmail || null,
        issueDescription || null,
      ],
    );

    if (therapistRows[0].email) {
      await sendBrevoEmail({
        toEmail: therapistRows[0].email,
        subject: "You have a new session request",
        htmlContent: `
                                    <p>Hello ${therapistRows[0].name || "Therapist"},</p>
                                    <p>You have a new session request on Unity Within.</p>
                                    <p><strong>Client:</strong> ${clientName || userRows[0].name || "Anonymous"}<br/><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}<br/><strong>Preferred time frame:</strong> ${preferredTimeFrame || "Not provided"}<br/><strong>Type:</strong> ${callMode}</p>
                                    ${issueDescription ? `<p><strong>Issue:</strong> ${issueDescription}</p>` : ""}
                                    <p>Please review this request in Therapist Portal.</p>
                                `,
      });
    }

    io.emit("support_session_status_changed", {
      sessionId: insertResult.insertId,
      status: "pending",
      therapistId,
    });

    // Notify therapist in real-time about the new session request
    const therapistUserId = Number(therapistRows[0].user_id || 0);
    if (therapistUserId) {
      const userSockets = userPresence.get(therapistUserId);
      if (userSockets && userSockets.size > 0) {
        for (const socketId of userSockets) {
          io.to(socketId).emit("support_new_session_request", {
            sessionId: insertResult.insertId,
            therapistId,
            userId,
            clientName: clientName || userRows[0].name || "Client",
            date,
            time,
            callMode,
            issueDescription: issueDescription || null,
            message: `New session request from ${clientName || userRows[0].name || "a client"}`,
          });
        }
      }
    }

    return res.status(201).json({
      success: true,
      session: {
        id: insertResult.insertId,
        therapistId,
        userId,
        date,
        time,
        preferredTimeFrame: preferredTimeFrame || null,
        type: callMode,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Book session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to book session" });
  }
});

app.patch("/api/sessions/:id", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const userId = Number(req.body?.userId || req.headers["x-user-id"]);
    const date = (req.body?.date || "").toString().trim();
    const time = (req.body?.time || "").toString().trim();
    const preferredTimeFrame = (req.body?.preferredTimeFrame || "")
      .toString()
      .trim();
    const type = (req.body?.type || "").toString().trim().toLowerCase();

    if (!sessionId || !userId) {
      return res
        .status(400)
        .json({ success: false, error: "Session ID and user ID are required" });
    }

    const [sessionRows] = await pool.query(
      "SELECT id, user_id, status FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );

    if (!sessionRows?.length) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const currentSession = sessionRows[0];
    if (Number(currentSession.user_id) !== userId) {
      return res
        .status(403)
        .json({ success: false, error: "You can only edit your own sessions" });
    }

    if (
      !["new", "pending"].includes(String(currentSession.status).toLowerCase())
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Can only edit pending sessions" });
    }

    const updateFields = [];
    const updateValues = [];

    if (date) {
      updateFields.push("scheduled_date = ?");
      updateValues.push(date);
    }
    if (time) {
      updateFields.push("scheduled_time = ?");
      updateValues.push(time);
    }
    if (type && ["video", "voice"].includes(type)) {
      updateFields.push("call_mode = ?");
      updateValues.push(type);
    }
    if (preferredTimeFrame) {
      updateFields.push("preferred_timeframe = ?");
      updateValues.push(preferredTimeFrame);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    updateValues.push(sessionId);

    await pool.query(
      `UPDATE support_sessions SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    io.emit("support_session_status_changed", {
      sessionId,
      status: "updated",
      userId,
    });

    return res.json({ success: true, data: { updated: true, sessionId } });
  } catch (error) {
    console.error("Update session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update session" });
  }
});

app.delete("/api/sessions/:id", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const userId = Number(req.body?.userId || req.headers["x-user-id"]);

    if (!sessionId || !userId) {
      return res
        .status(400)
        .json({ success: false, error: "Session ID and user ID are required" });
    }

    const [sessionRows] = await pool.query(
      "SELECT id, user_id, status FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );

    if (!sessionRows?.length) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const currentSession = sessionRows[0];
    if (Number(currentSession.user_id) !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own sessions",
      });
    }

    await pool.query(
      "DELETE FROM support_session_messages WHERE session_id = ?",
      [sessionId],
    );
    await pool.query("DELETE FROM support_notifications WHERE session_id = ?", [
      sessionId,
    ]);
    await pool.query("DELETE FROM support_sessions WHERE id = ?", [sessionId]);

    io.emit("support_session_status_changed", {
      sessionId,
      status: "deleted",
      userId,
    });

    return res.json({ success: true, data: { deleted: true, sessionId } });
  } catch (error) {
    console.error("Delete session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete session" });
  }
});

app.get("/api/therapist/sessions", async (req, res) => {
  try {
    const therapistId = await resolveTherapistIdFromHeaders(req.headers);
    if (!therapistId) {
      return res
        .status(400)
        .json({ success: false, error: "Therapist identity not found" });
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.therapist_id, s.user_id, s.scheduled_date AS date, s.scheduled_time AS time,
                    s.call_mode AS type, s.status, s.start_time, s.end_time,
                    u.name AS client_name, u.email AS client_email
             FROM support_sessions s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.therapist_id = ?
             ORDER BY s.start_time DESC, s.created_at DESC
             LIMIT 300`,
      [therapistId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Therapist sessions fetch error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch therapist sessions" });
  }
});

app.get("/api/support/sessions/:id", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.user_id, s.therapist_id, s.call_mode, s.status, s.scheduled_date, s.scheduled_time, s.start_time, s.end_time,
                    u.name AS user_name, u.email AS user_email,
                    t.name AS therapist_name
             FROM support_sessions s
             LEFT JOIN users u ON u.id = s.user_id
             LEFT JOIN therapists t ON t.id = s.therapist_id
             WHERE s.id = ?
             LIMIT 1`,
      [sessionId],
    );

    const session = rows?.[0];
    if (!session) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const joinState = getJoinStateForSession(session);

    return res.json({
      success: true,
      data: {
        ...session,
        status: normalizeSupportStatus(session.status),
        ...joinState,
      },
    });
  } catch (error) {
    console.error("Support session detail error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch session details" });
  }
});

app.post("/api/sessions/:id/accept", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const therapistId = await resolveTherapistIdFromHeaders(req.headers);
    if (!sessionId || !therapistId) {
      return res.status(400).json({
        success: false,
        error: "Invalid session or therapist identity",
      });
    }

    const [sessionRows] = await pool.query(
      "SELECT id, therapist_id, user_id, call_mode FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );
    const session = sessionRows?.[0];
    if (!session)
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    if (Number(session.therapist_id) !== therapistId)
      return res
        .status(403)
        .json({ success: false, error: "Not your session" });

    await pool.query("UPDATE support_sessions SET status = ? WHERE id = ?", [
      "confirmed",
      sessionId,
    ]);

    const callMode =
      String(session.call_mode || "voice").toLowerCase() === "video"
        ? "video"
        : "voice";

    io.emit("support_session_status_changed", {
      sessionId,
      status: "confirmed",
      therapistId,
      userId: Number(session.user_id) || null,
      callMode,
    });

    const [sessionScheduleRows] = await pool.query(
      "SELECT scheduled_date, scheduled_time FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );
    const scheduledDate = sessionScheduleRows?.[0]?.scheduled_date || null;
    const scheduledTime = sessionScheduleRows?.[0]?.scheduled_time || null;

    const [therapistRows] = await pool.query(
      "SELECT email, name, user_id FROM therapists WHERE id = ? LIMIT 1",
      [therapistId],
    );

    io.emit("support_session_confirmed", {
      sessionId,
      therapistId,
      userId: Number(session.user_id) || null,
      callMode,
      therapistName: therapistRows?.[0]?.name || null,
      scheduledDate,
      scheduledTime,
      message: "Your session is confirmed.",
    });

    await emitNotificationToUser({
      userId: Number(session.user_id) || null,
      sessionId,
      type: "support_session_confirmed",
      title: resolveNotificationTitle("support_session_confirmed"),
      message: `Your session with ${therapistRows?.[0]?.name || "your therapist"} is confirmed`,
      payload: {
        therapistId,
        callMode,
        scheduledDate,
        scheduledTime,
      },
      eventKey: `session:${sessionId}:confirmed:user`,
    });

    await emitNotificationToUser({
      userId: Number(therapistRows?.[0]?.user_id || 0) || null,
      sessionId,
      type: "support_session_confirmed",
      title: resolveNotificationTitle("support_session_confirmed"),
      message: `Session confirmed. Prepare for ${scheduledDate || "the scheduled date"} ${scheduledTime || ""}`,
      payload: {
        therapistId,
        callMode,
        scheduledDate,
        scheduledTime,
      },
      eventKey: `session:${sessionId}:confirmed:therapist`,
    });

    const [userRows] = await pool.query(
      "SELECT email, name FROM users WHERE id = ? LIMIT 1",
      [session.user_id],
    );
    if (userRows?.[0]?.email) {
      await sendBrevoEmail({
        toEmail: userRows?.[0]?.email,
        subject: "Your session is confirmed",
        htmlContent: `<p>Hello ${userRows?.[0]?.name || "there"},</p><p>Your ${callMode} session has been confirmed.</p><p>Date: ${scheduledDate || "TBD"} Time: ${scheduledTime || "TBD"}</p>`,
      });
    }

    if (therapistRows?.[0]?.email) {
      await sendBrevoEmail({
        toEmail: therapistRows?.[0]?.email,
        subject: "Session confirmed",
        htmlContent: `<p>Hello ${therapistRows?.[0]?.name || "Therapist"},</p><p>Session confirmed. Prepare for ${scheduledDate || "the scheduled date"} ${scheduledTime || ""}.</p>`,
      });
    }

    return res.json({
      success: true,
      status: "confirmed",
      callMode,
      scheduledDate,
      scheduledTime,
    });
  } catch (error) {
    console.error("Accept session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to accept session" });
  }
});

app.post("/api/sessions/:id/reject", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const therapistId = await resolveTherapistIdFromHeaders(req.headers);
    if (!sessionId || !therapistId) {
      return res.status(400).json({
        success: false,
        error: "Invalid session or therapist identity",
      });
    }

    const [sessionRows] = await pool.query(
      "SELECT id, therapist_id FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );
    const session = sessionRows?.[0];
    if (!session)
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    if (Number(session.therapist_id) !== therapistId)
      return res
        .status(403)
        .json({ success: false, error: "Not your session" });

    await pool.query("UPDATE support_sessions SET status = ? WHERE id = ?", [
      "rejected",
      sessionId,
    ]);
    io.emit("support_session_status_changed", {
      sessionId,
      status: "rejected",
      therapistId,
    });

    return res.json({ success: true, status: "rejected" });
  } catch (error) {
    console.error("Reject session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to reject session" });
  }
});

app.post("/api/sessions/:id/start", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId)
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });

    await pool.query(
      "UPDATE support_sessions SET status = ?, start_time = COALESCE(start_time, NOW()) WHERE id = ?",
      ["in_progress", sessionId],
    );
    io.emit("support_session_status_changed", { sessionId, status: "ongoing" });
    return res.json({ success: true, status: "ongoing" });
  } catch (error) {
    console.error("Start session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to start session" });
  }
});

app.post("/api/sessions/:id/complete", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId)
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });

    await pool.query(
      "UPDATE support_sessions SET status = ?, end_time = NOW() WHERE id = ?",
      ["ended", sessionId],
    );
    io.emit("support_session_status_changed", {
      sessionId,
      status: "completed",
    });
    return res.json({ success: true, status: "completed" });
  } catch (error) {
    console.error("Complete session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to complete session" });
  }
});

const normalizeSupportStatus = (value, fallback = "new") => {
  const raw = (value || "").toString().trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "new" || raw === "queued" || raw === "pending") return "new";
  if (raw === "accepted" || raw === "confirmed") return "confirmed";
  if (raw === "live") return "live";
  if (raw === "rejected") return "rejected";
  if (
    raw === "in_progress" ||
    raw === "in-progress" ||
    raw === "started" ||
    raw === "active"
  )
    return "in_progress";
  if (raw === "ongoing") return "in_progress";
  if (
    raw === "ended" ||
    raw === "closed" ||
    raw === "done" ||
    raw === "resolved"
  )
    return "ended";
  if (raw === "completed") return "ended";
  return fallback;
};

const normalizeSupportPriority = (value, fallback = "normal") => {
  const raw = (value || "").toString().trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "high" || raw === "urgent") return "high";
  if (raw === "normal" || raw === "medium" || raw === "default")
    return "normal";
  if (raw === "low") return "low";
  return fallback;
};

app.get("/api/support/portal/sessions", async (req, res) => {
  try {
    const adminRequest = isAdminRequest(req);
    const therapistRequest = isTherapistRequest(req);

    if (!adminRequest && !therapistRequest) {
      return res
        .status(403)
        .json({ success: false, error: "Therapist or admin access required" });
    }

    const therapistIdFromHeader = await resolveTherapistIdFromHeaders(
      req.headers,
    );

    const params = [];
    let whereClause = "";

    if (!adminRequest) {
      if (!therapistIdFromHeader) {
        return res
          .status(400)
          .json({ success: false, error: "Missing therapist id" });
      }
      whereClause = "WHERE s.therapist_id = ?";
      params.push(therapistIdFromHeader);
    }

    const [sessionRows] = await pool.query(
      `SELECT s.id, s.user_id, s.therapist_id, s.type, s.call_mode, s.start_time, s.end_time, s.status, s.priority, s.rating,
                    s.scheduled_date, s.scheduled_time, s.preferred_timeframe,
                    s.client_name, s.client_phone, s.client_age, s.client_email, s.issue_description,
                    t.name AS therapist_name, t.specialization AS therapist_specialization,
                    u.name AS user_name, u.email AS user_email
             FROM support_sessions s
             LEFT JOIN therapists t ON s.therapist_id = t.id
             LEFT JOIN users u ON s.user_id = u.id
             ${whereClause}
             ORDER BY COALESCE(CAST(s.scheduled_date AS DATETIME), s.start_time) DESC
             LIMIT 400`,
      params,
    );

    const sessions = (sessionRows || []).map((item) => ({
      ...item,
      status: normalizeSupportStatus(item.status),
      priority: normalizeSupportPriority(item.priority),
      therapist_online: isTherapistOnline(item.therapist_id),
    }));

    let therapists = [];
    if (adminRequest) {
      const [therapistRows] = await pool.query(
        `SELECT id, name, email, specialization, availability, availability_schedule, status, created_at
                 FROM therapists
                 ORDER BY created_at DESC`,
      );

      therapists = (therapistRows || []).map((item) => ({
        ...item,
        is_online: isTherapistOnline(item.id),
      }));
    }

    return res.json({
      success: true,
      scope: adminRequest ? "admin" : "therapist",
      data: {
        sessions,
        therapists,
        therapistId: adminRequest ? null : therapistIdFromHeader,
      },
    });
  } catch (error) {
    console.error("Support portal sessions error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load therapist portal data" });
  }
});

app.post("/api/support/sessions", async (req, res) => {
  try {
    const { therapistId, type, callMode, status, priority, userId } = req.body;
    const resolvedType = type === "call" ? "call" : "chat";
    const resolvedCallMode = callMode === "video" ? "video" : "voice";
    const resolvedStatus = normalizeSupportStatus(status, "new");
    const resolvedPriority = normalizeSupportPriority(priority, "normal");
    const parsedUserId = Number(userId || req.headers["x-user-id"]) || null;

    if (!therapistId) {
      return res
        .status(400)
        .json({ success: false, error: "therapistId is required" });
    }

    let clientName = null;
    let clientEmail = null;

    if (parsedUserId) {
      const [userRows] = await pool.query(
        "SELECT name, email FROM users WHERE id = ? LIMIT 1",
        [parsedUserId],
      );
      if (userRows?.[0]) {
        clientName = userRows[0].name;
        clientEmail = userRows[0].email;
      }
    }

    const [insertResult] = await pool.query(
      `INSERT INTO support_sessions (user_id, therapist_id, type, call_mode, status, priority, client_name, client_email, start_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parsedUserId,
        therapistId,
        resolvedType,
        resolvedCallMode,
        resolvedStatus,
        resolvedPriority,
        clientName,
        clientEmail,
      ],
    );

    return res
      .status(201)
      .json({ success: true, data: { id: insertResult.insertId } });
  } catch (error) {
    console.error("Support create session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create session" });
  }
});

app.patch("/api/support/sessions/:id/assign", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const sessionId = Number(req.params.id);
    const therapistId = Number(req.body?.therapistId);

    if (!sessionId || !therapistId) {
      return res.status(400).json({
        success: false,
        error: "Valid sessionId and therapistId are required",
      });
    }

    const [sessionRows] = await pool.query(
      "SELECT id FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );
    if (!sessionRows?.length) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const [therapistRows] = await pool.query(
      "SELECT id, name, specialization FROM therapists WHERE id = ? LIMIT 1",
      [therapistId],
    );
    if (!therapistRows?.length) {
      return res
        .status(404)
        .json({ success: false, error: "Therapist not found" });
    }

    await pool.query(
      `UPDATE support_sessions
             SET therapist_id = ?
             WHERE id = ?`,
      [therapistId, sessionId],
    );

    return res.json({
      success: true,
      data: {
        sessionId,
        therapist_id: therapistId,
        therapist_name: therapistRows[0].name,
        therapist_specialization: therapistRows[0].specialization,
        therapist_online: isTherapistOnline(therapistId),
      },
    });
  } catch (error) {
    console.error("Support assign session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to assign session therapist" });
  }
});

app.patch("/api/support/sessions/:id/state", async (req, res) => {
  try {
    const adminRequest = isAdminRequest(req);
    const therapistRequest = isTherapistRequest(req);

    if (!adminRequest && !therapistRequest) {
      return res
        .status(403)
        .json({ success: false, error: "Therapist or admin access required" });
    }

    const sessionId = Number(req.params.id);
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });
    }

    const [sessionRows] = await pool.query(
      `SELECT id, therapist_id, status, priority
             FROM support_sessions
             WHERE id = ?
             LIMIT 1`,
      [sessionId],
    );

    const currentSession = sessionRows?.[0];
    if (!currentSession) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const therapistIdFromHeader = await resolveTherapistIdFromHeaders(
      req.headers,
    );
    if (
      !adminRequest &&
      Number(currentSession.therapist_id) !== therapistIdFromHeader
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own sessions",
      });
    }

    const requestedStatus =
      typeof req.body?.status === "string" ? req.body.status : undefined;
    const requestedPriority =
      typeof req.body?.priority === "string" ? req.body.priority : undefined;

    if (!requestedStatus && !requestedPriority) {
      return res
        .status(400)
        .json({ success: false, error: "status or priority is required" });
    }

    const nextStatus = normalizeSupportStatus(
      requestedStatus,
      normalizeSupportStatus(currentSession.status),
    );
    let nextPriority = normalizeSupportPriority(
      requestedPriority,
      normalizeSupportPriority(currentSession.priority),
    );

    if (!adminRequest) {
      nextPriority = normalizeSupportPriority(currentSession.priority);
    }

    await pool.query(
      `UPDATE support_sessions
             SET status = ?,
                 priority = ?,
                 start_time = CASE
                     WHEN ? IN ('live', 'ongoing', 'in_progress') THEN COALESCE(start_time, NOW())
                     ELSE start_time
                 END,
                 end_time = CASE
                     WHEN ? = 'ended' THEN COALESCE(end_time, NOW())
                     WHEN ? <> 'ended' AND ? <> 'completed' THEN NULL
                     ELSE end_time
                 END
             WHERE id = ?`,
      [
        nextStatus,
        nextPriority,
        nextStatus,
        nextStatus,
        nextStatus,
        nextStatus,
        sessionId,
      ],
    );

    io.emit("support_session_status_changed", {
      sessionId,
      status:
        nextStatus === "in_progress"
          ? "ongoing"
          : nextStatus === "ended"
            ? "completed"
            : nextStatus,
      therapistId: Number(currentSession.therapist_id) || null,
      priority: nextPriority,
    });

    return res.json({
      success: true,
      data: {
        sessionId,
        status: nextStatus,
        priority: nextPriority,
      },
    });
  } catch (error) {
    console.error("Support update session state error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update session state" });
  }
});

app.patch("/api/support/sessions/:id/end", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });
    }

    const nextStatus = normalizeSupportStatus(req.body?.status, "ended");

    const [sessionRows] = await pool.query(
      `SELECT s.id, s.therapist_id, s.user_id,
                    t.user_id AS therapist_user_id,
                    t.name AS therapist_name,
                    u.name AS user_name
             FROM support_sessions s
             LEFT JOIN therapists t ON t.id = s.therapist_id
             LEFT JOIN users u ON u.id = s.user_id
             WHERE s.id = ?
             LIMIT 1`,
      [sessionId],
    );
    const currentSession = sessionRows?.[0];
    if (!currentSession) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    await pool.query(
      `UPDATE support_sessions
             SET status = ?, end_time = NOW()
             WHERE id = ?`,
      [nextStatus, sessionId],
    );

    io.emit("support_session_status_changed", {
      sessionId,
      status: nextStatus === "ended" ? "completed" : nextStatus,
      therapistId: Number(currentSession.therapist_id) || null,
      userId: Number(currentSession.user_id) || null,
      endedByRole: toSafeText(req.body?.endedByRole) || null,
      endedByUserId: Number(req.body?.endedByUserId || 0) || null,
    });

    const endedByRole = toSafeText(req.body?.endedByRole) || "system";
    await emitNotificationToUser({
      userId: Number(currentSession.user_id) || null,
      sessionId,
      type: "support_session_ended",
      title: resolveNotificationTitle("support_session_ended"),
      message: `Session ended by ${endedByRole}.`,
      payload: {
        therapistId: Number(currentSession.therapist_id) || null,
        endedByRole,
      },
      eventKey: `session:${sessionId}:ended:user`,
    });

    await emitNotificationToUser({
      userId: Number(currentSession.therapist_user_id || 0) || null,
      sessionId,
      type: "support_session_ended",
      title: resolveNotificationTitle("support_session_ended"),
      message: `Session with ${currentSession.user_name || "client"} has ended.`,
      payload: {
        therapistId: Number(currentSession.therapist_id) || null,
        endedByRole,
      },
      eventKey: `session:${sessionId}:ended:therapist`,
    });

    return res.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Support end session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to end session" });
  }
});

app.post("/api/support/sessions/:id/rate", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const rating = Number(req.body?.rating);

    if (!sessionId || !rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid rating request" });
    }

    await pool.query("UPDATE support_sessions SET rating = ? WHERE id = ?", [
      rating,
      sessionId,
    ]);

    const [sessionRows] = await pool.query(
      "SELECT therapist_id FROM support_sessions WHERE id = ? LIMIT 1",
      [sessionId],
    );
    const therapistId = sessionRows?.[0]?.therapist_id;
    if (therapistId) {
      const [ratingRows] = await pool.query(
        "SELECT COALESCE(ROUND(AVG(rating), 1), 4.5) AS avg_rating FROM support_sessions WHERE therapist_id = ? AND rating IS NOT NULL",
        [therapistId],
      );
      const avgRating = Number(ratingRows?.[0]?.avg_rating || 4.5);
      await pool.query("UPDATE therapists SET rating = ? WHERE id = ?", [
        avgRating,
        therapistId,
      ]);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Support rate session error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to save rating" });
  }
});

app.get("/api/support/sessions/:id/messages", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid session id" });
    }

    const [rows] = await pool.query(
      `SELECT id, session_id, sender_role, sender_name, content, attachment_name, created_at
             FROM support_session_messages
             WHERE session_id = ?
             ORDER BY created_at ASC`,
      [sessionId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Support session history error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch session messages" });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = resolveNotificationUserId(req);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    const onlyUnread = String(req.query?.unread || "").toLowerCase() === "true";
    const limit = Math.min(Math.max(Number(req.query?.limit || 50), 1), 200);

    const query = onlyUnread
      ? `SELECT id, user_id, session_id, type, title, message, payload, channel, is_read, read_at, created_at
                             FROM support_notifications
                             WHERE user_id = ? AND is_read = FALSE
                             ORDER BY created_at DESC
                             LIMIT ?`
      : `SELECT id, user_id, session_id, type, title, message, payload, channel, is_read, read_at, created_at
                             FROM support_notifications
                             WHERE user_id = ?
                             ORDER BY created_at DESC
                             LIMIT ?`;

    const [rows] = await pool.query(query, [userId, limit]);

    const data = (rows || []).map((row) => ({
      id: row.id,
      userId: Number(row.user_id),
      sessionId: row.session_id ? Number(row.session_id) : null,
      type: row.type,
      title: row.title,
      message: row.message,
      payload: (() => {
        try {
          return row.payload ? JSON.parse(row.payload) : null;
        } catch {
          return null;
        }
      })(),
      channel: row.channel || "in_app",
      isRead: Boolean(row.is_read),
      readAt: row.read_at,
      createdAt: row.created_at,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch notifications" });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const userId = resolveNotificationUserId(req);
    if (!notificationId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Valid notification id and userId are required",
      });
    }

    await pool.query(
      `UPDATE support_notifications
             SET is_read = ?, read_at = NOW()
             WHERE id = ? AND user_id = ?`,
      [true, notificationId, userId],
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to mark notification read" });
  }
});

app.post("/api/notifications/read-all", async (req, res) => {
  try {
    const userId = resolveNotificationUserId(req);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    await pool.query(
      `UPDATE support_notifications
             SET is_read = ?, read_at = NOW()
             WHERE user_id = ? AND is_read = ?`,
      [true, userId, false],
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to mark notifications read" });
  }
});

// Admin Endpoints
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [[{ userCount }]] = await pool.query(
      "SELECT COUNT(*) as userCount FROM users",
    );
    const [[{ messageCount }]] = await pool.query(
      "SELECT COUNT(*) as messageCount FROM chat_messages",
    );
    const [[{ moodCount }]] = await pool.query(
      "SELECT COUNT(*) as moodCount FROM user_moods",
    );

    res.json({ success: true, stats: { userCount, messageCount, moodCount } });
  } catch (error) {
    console.error("❌ Admin stats endpoint error:", error.message);
    res.status(500).json({
      error: "Failed to fetch stats",
      details: error.message,
      hint: "Check database connection and ADMIN_EMAIL configuration",
    });
  }
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at, is_active FROM users ORDER BY created_at DESC",
    );
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/api/admin/moderation-logs", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT m.*, u.name as user_name 
            FROM moderation_logs m 
            LEFT JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC LIMIT 50
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch moderation logs" });
  }
});

app.get("/api/admin/chat/messages", requireAdmin, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const [rows] = await pool.query(`
            SELECT m.id, m.content, m.created_at, u.name as user_name 
            FROM chat_messages m 
            LEFT JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC LIMIT 100
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.delete("/api/admin/chat/messages/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM chat_messages WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Admin: Toggle User Role (Promote/Demote)
app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [
      role,
      req.params.id,
    ]);
    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// Admin: Get all events
app.get("/api/admin/events", async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT 
                e.*,
                e.featured as is_featured,
                u.name as created_by_name,
                COALESCE(COUNT(r.id), 0) as attendees_count
            FROM events e 
            LEFT JOIN users u ON e.created_by = u.id 
            LEFT JOIN rsvps r ON e.id = r.event_id AND r.status = 'yes'
            GROUP BY e.id, e.title, e.slug, e.description, e.category, e.date, e.end_date, 
                     e.duration, e.location, e.is_online, e.meeting_link, e.capacity, 
                     e.created_by, e.is_private, e.featured, e.is_paid, e.price, 
                     e.created_at, e.thumbnail_url, e.video_url, u.id, u.name
            ORDER BY e.date DESC
        `);
    console.log(`[ADMIN EVENTS] Fetched ${rows.length} events`);
    res.json({ success: true, events: rows });
  } catch (error) {
    console.error("[ADMIN EVENTS] Error fetching events:", error);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// Admin: Delete event
app.delete("/api/admin/events/:id", requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    // Delete all related RSVPs first
    await pool.query("DELETE FROM rsvps WHERE event_id = ?", [eventId]);

    // Delete all event messages
    await pool.query("DELETE FROM event_messages WHERE event_id = ?", [
      eventId,
    ]);

    // Delete event invites
    await pool.query("DELETE FROM invites WHERE event_id = ?", [eventId]);

    // Finally delete the event
    const [result] = await pool.query("DELETE FROM events WHERE id = ?", [
      eventId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("[ADMIN EVENTS] Error deleting event:", error);
    res.status(500).json({ success: false, error: "Failed to delete event" });
  }
});

// Admin: Get RSVPs for an event
app.get("/api/admin/events/:eventId/rsvps", requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [rsvps] = await pool.query(
      `
            SELECT 
                r.id,
                r.event_id,
                r.user_id,
                COALESCE(u.name, 'Unknown User') as user_name,
                COALESCE(u.email, r.user_email_snapshot) as user_email,
                r.status,
                r.paid,
                r.created_at,
                r.updated_at as rsvped_at
            FROM rsvps r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.event_id = ?
            ORDER BY r.created_at DESC
        `,
      [eventId],
    );
    res.json({ success: true, rsvps });
  } catch (error) {
    console.error("[ADMIN RSVPS] Error fetching RSVPs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch RSVPs" });
  }
});

// Admin: Delete RSVP
app.delete(
  "/api/admin/events/:eventId/rsvps/:rsvpId",
  requireAdmin,
  async (req, res) => {
    try {
      const rsvpId = parseInt(req.params.rsvpId);
      const eventId = parseInt(req.params.eventId);

      const [result] = await pool.query(
        "DELETE FROM rsvps WHERE id = ? AND event_id = ?",
        [rsvpId, eventId],
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, error: "RSVP not found" });
      }

      res.json({ success: true, message: "RSVP deleted successfully" });
    } catch (error) {
      console.error("[ADMIN RSVPS] Error deleting RSVP:", error);
      res.status(500).json({ success: false, error: "Failed to delete RSVP" });
    }
  },
);

// Admin: Get all moods
app.get("/api/admin/moods", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT m.*, u.name as user_name 
            FROM user_moods m 
            LEFT JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC LIMIT 100
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

// Admin: Get all journals
app.get("/api/admin/journals", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT j.*, u.name as user_name 
            FROM journal_entries j 
            LEFT JOIN users u ON j.user_id = u.id 
            ORDER BY j.created_at DESC LIMIT 100
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

// Admin: Get all tiny wins
app.get("/api/admin/tiny-wins", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT w.*, u.name as user_name 
            FROM tiny_wins w 
            LEFT JOIN users u ON w.user_id = u.id 
            ORDER BY w.created_at DESC LIMIT 100
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tiny wins" });
  }
});

// Admin: Get all reports
app.get("/api/admin/reports", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT r.*, u.name as reporter_name, m.content as message_content
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN chat_messages m ON r.message_id = m.id
            ORDER BY r.created_at DESC
        `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Admin: Room Management
app.post("/api/admin/chat/rooms", requireAdmin, async (req, res) => {
  try {
    const { name, description, type } = req.body;
    await pool.query(
      "INSERT INTO chat_rooms (name, description, type) VALUES (?, ?, ?)",
      [name, description, type || "public"],
    );
    res.json({ success: true, message: "Room created" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.delete("/api/admin/chat/rooms/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM chat_rooms WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// Admin: Therapist Management
app.get("/api/admin/therapists", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM therapists ORDER BY created_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch therapists" });
  }
});

app.post("/api/admin/therapists", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      photo,
      email,
      password,
      phone,
      specialization,
      bio,
      qualifications,
      experience,
      languages,
      availability,
      availability_schedule,
      session_price,
      rating,
      status,
    } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({
        success: false,
        error: "name and specialization are required",
      });
    }

    const hashedTherapistPassword = password
      ? await bcrypt.hash(password, 10)
      : null;

    const [result] = await pool.query(
      `INSERT INTO therapists (name, photo, email, password_hash, phone, specialization, bio, qualifications, experience, languages, availability, availability_schedule, session_price, rating, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        photo || "",
        email || "",
        hashedTherapistPassword,
        phone || "",
        specialization,
        bio || "",
        qualifications || "",
        experience || "1+ years",
        languages || "English, Swahili",
        availability || "online",
        availability_schedule || "",
        session_price || "$5 chat / $10 video",
        Number(rating) || 4.5,
        normalizeTherapistStatus(status, "pending"),
      ],
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add therapist" });
  }
});

app.patch("/api/admin/therapists/:id", requireAdmin, async (req, res) => {
  try {
    const therapistId = Number(req.params.id);
    if (!therapistId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid therapist id" });
    }

    const {
      name,
      photo,
      email,
      password,
      phone,
      specialization,
      bio,
      qualifications,
      experience,
      languages,
      availability,
      availability_schedule,
      session_price,
      rating,
      status,
    } = req.body;

    const hashedTherapistPassword = password
      ? await bcrypt.hash(password, 10)
      : null;

    if (hashedTherapistPassword) {
      await pool.query(
        `UPDATE therapists
                 SET name = ?, photo = ?, email = ?, password_hash = ?, phone = ?, specialization = ?, bio = ?, qualifications = ?, experience = ?,
                     languages = ?, availability = ?, availability_schedule = ?, session_price = ?, rating = ?, status = ?
                 WHERE id = ?`,
        [
          name,
          photo || "",
          email || "",
          hashedTherapistPassword,
          phone || "",
          specialization,
          bio || "",
          qualifications || "",
          experience || "1+ years",
          languages || "English, Swahili",
          availability || "online",
          availability_schedule || "",
          session_price || "$5 chat / $10 video",
          Number(rating) || 4.5,
          normalizeTherapistStatus(status, "pending"),
          therapistId,
        ],
      );
    } else {
      await pool.query(
        `UPDATE therapists
                 SET name = ?, photo = ?, email = ?, phone = ?, specialization = ?, bio = ?, qualifications = ?, experience = ?,
                     languages = ?, availability = ?, availability_schedule = ?, session_price = ?, rating = ?, status = ?
                 WHERE id = ?`,
        [
          name,
          photo || "",
          email || "",
          phone || "",
          specialization,
          bio || "",
          qualifications || "",
          experience || "1+ years",
          languages || "English, Swahili",
          availability || "online",
          availability_schedule || "",
          session_price || "$5 chat / $10 video",
          Number(rating) || 4.5,
          normalizeTherapistStatus(status, "pending"),
          therapistId,
        ],
      );
    }

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update therapist" });
  }
});

app.patch(
  "/api/admin/therapists/:id/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const therapistId = Number(req.params.id);
      const status = normalizeTherapistStatus(req.body?.status, "approved");
      if (!therapistId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid therapist id" });
      }

      await pool.query("UPDATE therapists SET status = ? WHERE id = ?", [
        status,
        therapistId,
      ]);
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to update therapist status" });
    }
  },
);

app.delete("/api/admin/therapists/:id", requireAdmin, async (req, res) => {
  try {
    const therapistId = Number(req.params.id);
    if (!therapistId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid therapist id" });
    }

    await pool.query("DELETE FROM therapists WHERE id = ?", [therapistId]);
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to remove therapist" });
  }
});

app.get("/api/chat/messages", requireUnityUser, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const [rows] = await pool.query(
      `SELECT m.id, m.user_id, m.content, m.created_at, 
                    r.content as reply_content, r.user_id as reply_user_id
             FROM chat_messages m
             LEFT JOIN chat_messages r ON m.reply_to_id = r.id
             ORDER BY m.created_at ASC 
             LIMIT 100`,
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/chat/messages", requireUnityUser, async (req, res) => {
  try {
    const { content, replyToId } = req.body;
    console.log(
      `📩 Received message from User ${req.user.id}: "${content}" (ReplyTo: ${replyToId})`,
    );

    if (!content) {
      console.log("❌ Content missing");
      return res.status(400).json({ error: "Message content required" });
    }

    const [result] = await pool.query(
      "INSERT INTO chat_messages (user_id, content, reply_to_id) VALUES (?, ?, ?)",
      [req.user.id, content, replyToId || null],
    );
    console.log(`✅ Message saved. ID: ${result.insertId}`);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("❌ Post message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mood Logging Endpoints
// Mood Logging Endpoints
const resolveRouteUserId = (req) => {
  const candidates = [
    req.user?.id,
    req.body?.userId,
    req.query?.userId,
    req.params?.userId,
    req.headers["x-user-id"],
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
};

app.post("/api/moods", async (req, res) => {
  try {
    const { mood, intensity, note } = req.body;
    const userId = resolveRouteUserId(req);

    if (!userId || !mood) {
      return res.status(400).json({
        error: "Missing required field(s): userId and mood are required",
      });
    }

    // mood is ENUM in DB (Capitalized like 'Happy', 'Sad')
    const normalizedMood =
      mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();

    const [result] = await pool.query(
      "INSERT INTO user_moods (user_id, mood, intensity, note) VALUES (?, ?, ?, ?)",
      [userId, normalizedMood, intensity || 5, note || null],
    );

    res.json({
      success: true,
      message: "Mood logged",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Log mood error:", error);
    res.status(500).json({ error: "Failed to log mood" });
  }
});

app.get("/api/moods", async (req, res) => {
  try {
    const userId = resolveRouteUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const { range } = req.query; // range: day, week, month

    let timeFilter = "";
    if (range === "day") {
      timeFilter = "AND created_at >= NOW() - INTERVAL 1 DAY";
    } else if (range === "week") {
      timeFilter = "AND created_at >= NOW() - INTERVAL 1 WEEK";
    } else if (range === "month") {
      timeFilter = "AND created_at >= NOW() - INTERVAL 1 MONTH";
    } else if (range === "annual" || range === "year") {
      timeFilter = "AND created_at >= NOW() - INTERVAL 1 YEAR";
    }

    const [rows] = await pool.query(
      `SELECT id, mood, intensity, note, created_at 
             FROM user_moods 
             WHERE user_id = ? ${timeFilter}
             ORDER BY created_at ASC`,
      [userId],
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Fetch mood error:", error);
    res.status(500).json({ error: "Failed to fetch mood history" });
  }
});

app.get("/api/mood-logs", async (req, res) => {
  try {
    const userId = resolveRouteUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const [rows] = await pool.query(
      `SELECT id, mood, intensity, note, created_at
             FROM user_moods
             WHERE user_id = ?
             ORDER BY created_at DESC`,
      [userId],
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Fetch mood logs error:", error);
    res.status(500).json({ error: "Failed to fetch mood logs" });
  }
});

// Backward compatibility for existing frontend if needed (redirect to new)
// But we will update frontend, so we can remove old /api/mood if we want.
// Keeping it mapped to new logic briefly or just replacing it.
// I replaced the block, so old /api/mood is gone.

// Journal endpoints
app.post("/api/journals", async (req, res) => {
  try {
    const { content, moodId } = req.body;
    const userId = resolveRouteUserId(req);

    if (!userId || !content) {
      return res.status(400).json({
        error: "Missing required fields: userId and content are required",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO journal_entries (user_id, content, mood_id) VALUES (?, ?, ?)",
      [userId, content, moodId || null],
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Journal entry saved",
    });
  } catch (error) {
    console.error("Save journal error:", error);
    res.status(500).json({ error: "Failed to save journal entry" });
  }
});

app.get("/api/journals/:userId", async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!requestedUserId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (req.user?.id) {
      const isOwnRequest = requestedUserId === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isOwnRequest && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const scopedUserId = requestedUserId;
    const [rows] = await pool.query(
      `SELECT j.*, um.mood 
             FROM journal_entries j 
             LEFT JOIN user_moods um ON j.mood_id = um.id
             WHERE j.user_id = ? 
             ORDER BY j.created_at DESC`,
      [scopedUserId],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Fetch journals error:", error);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

// Tiny Wins (Micro-Gratitude)
app.post("/api/tiny-wins", requireUnityUser, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing fields" });

    await pool.query("INSERT INTO tiny_wins (user_id, content) VALUES (?, ?)", [
      req.user.id,
      content,
    ]);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/tiny-wins/:userId", requireUnityUser, async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    const isOwnRequest = requestedUserId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwnRequest && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const scopedUserId =
      isAdmin && requestedUserId ? requestedUserId : req.user.id;
    const [rows] = await pool.query(
      "SELECT * FROM tiny_wins WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
      [scopedUserId],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// Events APIs
app.get("/api/events", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const offset = (page - 1) * limit;
    const includePrivate = req.query.includePrivate === "true";
    const includeExpired = req.query.includeExpired === "true";

    const privacyFilter = includePrivate ? "" : "AND e.is_private = FALSE";
    const activeEventsFilter = includeExpired
      ? ""
      : `AND COALESCE(
                   e.end_date,
                   DATE_ADD(e.date, INTERVAL COALESCE(NULLIF(e.duration, 0), 60) MINUTE)
               ) >= NOW()`;

    const [events] = await pool.query(
      `SELECT
                e.id,
                e.slug,
                e.title,
                e.tagline,
                e.description,
                e.category,
                e.tags,
                e.template_type,
                e.date,
                e.end_date,
                e.duration,
                e.location,
                e.is_online,
                e.meeting_link,
                e.is_paid,
                e.price,
                e.currency,
                e.payment_method,
                e.early_bird_price,
                e.discount_code,
                e.discount_percent,
                e.capacity,
                e.is_private,
                e.is_recurring,
                e.allow_anonymous,
                e.allow_maybe,
                e.waitlist_enabled,
                e.chat_enabled,
                e.recording_allowed,
                e.send_invite_emails,
                e.reminder_one_hour,
                e.reminder_ten_minutes,
                e.recommendations_enabled,
                e.featured,
                e.thumbnail_url,
                e.video_url,
                e.created_by,
                e.created_at,
                COALESCE(SUM(CASE WHEN r.status = 'yes' THEN 1 ELSE 0 END), 0) AS attendees_count
            FROM events e
            LEFT JOIN rsvps r ON r.event_id = e.id
            WHERE 1=1 ${privacyFilter} ${activeEventsFilter}
            GROUP BY e.id
            ORDER BY e.date ASC
            LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
             FROM events e
               WHERE 1=1 ${privacyFilter} ${activeEventsFilter}`,
    );

    const total = Number(countRows?.[0]?.total || 0);
    const mappedEvents = (events || []).map((eventRow) => {
      const attendeesCount = Number(eventRow.attendees_count || 0);
      const capacity =
        eventRow.capacity !== null && eventRow.capacity !== undefined
          ? Number(eventRow.capacity)
          : null;
      const spotsLeft = capacity
        ? Math.max(capacity - attendeesCount, 0)
        : null;

      return {
        ...eventRow,
        attendees_count: attendeesCount,
        spots_left: spotsLeft,
        event_url: buildEventPublicLink(req, eventRow.slug),
      };
    });

    return res.json({
      success: true,
      events: mappedEvents,
      page,
      limit,
      total,
      hasMore: offset + mappedEvents.length < total,
    });
  } catch (error) {
    console.error("Fetch events error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch events" });
  }
});

app.get("/api/events/private/:token", async (req, res) => {
  try {
    const token = (req.params.token || "").toString().trim();
    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid invite token" });
    }

    const [rows] = await pool.query(
      `SELECT
                i.id AS invite_id,
                i.expires_at,
                e.id,
                e.slug,
                e.title,
                e.description,
                e.date,
                e.location,
                e.is_online,
                e.is_paid,
                e.price,
                e.capacity,
                e.is_private,
                e.thumbnail_url,
                e.video_url
             FROM invites i
             JOIN events e ON e.id = i.event_id
             WHERE i.token = ?
             LIMIT 1`,
      [token],
    );

    const row = rows?.[0];
    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: "Invite not found" });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res
        .status(410)
        .json({ success: false, error: "Invite link has expired" });
    }

    const effectiveEndDate = row.end_date
      ? new Date(row.end_date)
      : new Date(new Date(row.date).getTime() + 60 * 60 * 1000);

    if (effectiveEndDate < new Date()) {
      return res
        .status(410)
        .json({ success: false, error: "This event has ended" });
    }

    return res.json({ success: true, event: row });
  } catch (error) {
    console.error("Fetch private event error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load private event" });
  }
});

app.get("/api/events/:eventId/calendar", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid event id" });
    }

    const [rows] = await pool.query(
      "SELECT id, slug, title, description, date, end_date, location FROM events WHERE id = ? LIMIT 1",
      [eventId],
    );

    const eventRow = rows?.[0];
    if (!eventRow) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const start = new Date(eventRow.date);
    const end = eventRow.end_date
      ? new Date(eventRow.end_date)
      : new Date(start.getTime() + 60 * 60 * 1000);
    const toIcsDate = (value) =>
      value
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
    const description = String(eventRow.description || "").replace(
      /\n/g,
      "\\n",
    );

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${eventRow.slug || `event-${eventId}`}.ics"`,
    );
    return res.send(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Unity Within//Events//EN",
        "BEGIN:VEVENT",
        `UID:unitywithin-event-${eventRow.id}@unitywithin.app`,
        `SUMMARY:${eventRow.title}`,
        `DESCRIPTION:${description}`,
        `DTSTART:${toIcsDate(start)}`,
        `DTEND:${toIcsDate(end)}`,
        `LOCATION:${eventRow.location || "Online"}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
    );
  } catch (error) {
    console.error("Calendar export error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to generate calendar file" });
  }
});

app.get("/api/events/recommendations", async (req, res) => {
  try {
    const category = (req.query.category || req.query.interest || "")
      .toString()
      .trim()
      .toLowerCase();
    const limit = Math.min(10, Math.max(1, Number(req.query.limit || 5)));

    const hasCategoryFilter = Boolean(category);
    const [rows] = await pool.query(
      `SELECT
                e.id,
                e.slug,
                e.title,
                e.description,
                e.category,
                e.date,
                e.location,
                e.is_online,
                e.is_private,
                e.thumbnail_url,
                COALESCE(SUM(CASE WHEN r.status = 'yes' THEN 1 ELSE 0 END), 0) AS attendees_count
             FROM events e
             LEFT JOIN rsvps r ON r.event_id = e.id
             WHERE e.date >= NOW()
               AND e.is_private = FALSE
               AND (? = '' OR LOWER(e.category) = ?)
             GROUP BY e.id
             ORDER BY attendees_count DESC, e.date ASC
             LIMIT ?`,
      [
        hasCategoryFilter ? category : "",
        hasCategoryFilter ? category : "",
        limit,
      ],
    );

    return res.json({
      success: true,
      strategy: hasCategoryFilter ? "category-match" : "trending-upcoming",
      recommendations: rows || [],
    });
  } catch (error) {
    console.error("Fetch event recommendations error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch recommendations" });
  }
});

app.get("/api/events/:slug", async (req, res) => {
  try {
    const slug = (req.params.slug || "").toString().trim();
    if (!slug) {
      return res.status(400).json({ success: false, error: "Invalid slug" });
    }

    const isNumericSlug = /^\d+$/.test(slug);

    const [rows] = await pool.query(
      `SELECT
                e.id,
                e.slug,
                e.title,
                e.tagline,
                e.description,
                e.category,
                e.tags,
                e.template_type,
                e.date,
                e.end_date,
                e.duration,
                e.location,
                e.is_online,
                e.meeting_link,
                e.is_paid,
                e.price,
                e.currency,
                e.payment_method,
                e.early_bird_price,
                e.discount_code,
                e.discount_percent,
                e.capacity,
                e.is_private,
                e.is_recurring,
                e.allow_anonymous,
                e.allow_maybe,
                e.waitlist_enabled,
                e.chat_enabled,
                e.recording_allowed,
                e.send_invite_emails,
                e.reminder_one_hour,
                e.reminder_ten_minutes,
                e.recommendations_enabled,
                e.featured,
                e.thumbnail_url,
                e.video_url,
                e.created_by,
                e.created_at,
                COALESCE(SUM(CASE WHEN r.status = 'yes' THEN 1 ELSE 0 END), 0) AS attendees_count
             FROM events e
             LEFT JOIN rsvps r ON r.event_id = e.id
             WHERE e.slug = ? ${isNumericSlug ? "OR e.id = ?" : ""}
             GROUP BY e.id
             LIMIT 1`,
      isNumericSlug ? [slug, parseInt(slug, 10)] : [slug],
    );

    const row = rows?.[0];
    if (!row) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const durationMinutes = Number(row.duration || 60);
    const effectiveEndDate = row.end_date
      ? new Date(row.end_date)
      : new Date(
          new Date(row.date).getTime() +
            Math.max(durationMinutes, 1) * 60 * 1000,
        );

    if (effectiveEndDate < new Date()) {
      return res
        .status(410)
        .json({ success: false, error: "This event has ended" });
    }

    const attendeesCount = Number(row.attendees_count || 0);
    const capacity =
      row.capacity !== null && row.capacity !== undefined
        ? Number(row.capacity)
        : null;
    const spotsLeft = capacity ? Math.max(capacity - attendeesCount, 0) : null;

    const event = {
      ...row,
      attendees_count: attendeesCount,
      spots_left: spotsLeft,
      event_url: buildEventPublicLink(req, row.slug),
    };

    // Check if identified user has already RSVP'd 'yes'
    const identifiedUser = await resolveEventsIdentity(req);
    if (identifiedUser) {
      const [rsvpRows] = await pool.query(
        "SELECT id FROM rsvps WHERE user_id = ? AND event_id = ? AND status = 'yes' LIMIT 1",
        [identifiedUser.id, row.id],
      );
      event.has_rsvpd = rsvpRows?.length > 0;
    }

    return res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Fetch event detail error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch event details" });
  }
});

app.post(
  "/api/events",
  requireEventsRsvpIdentity,
  requireAdminOrTherapist,
  async (req, res) => {
    try {
      const {
        title,
        tagline,
        description,
        category,
        tags,
        templateType,
        date,
        endDate,
        duration,
        location,
        isOnline,
        meetingLink,
        isPaid,
        price,
        currency,
        paymentMethod,
        earlyBirdPrice,
        discountCode,
        discountPercent,
        capacity,
        isPrivate,
        isRecurring,
        allowAnonymous,
        allowMaybe,
        waitlistEnabled,
        chatEnabled,
        recordingAllowed,
        notifyEnrolled,
        remindOneHour,
        remindTenMinutes,
        recommendationsEnabled,
        featured,
        thumbnailUrl,
        videoUrl,
        slug,
      } = req.body || {};

      // Validate required fields
      if (!title || !title.trim()) {
        return res
          .status(400)
          .json({ success: false, error: "Event title is required" });
      }
      if (!date) {
        return res
          .status(400)
          .json({ success: false, error: "Event date is required" });
      }

      // Log event details for debugging
      console.log(`[Events] Creating event: "${title}" by user ${req.user.id}`);
      if (thumbnailUrl) {
        console.log(
          `[Events] Thumbnail size: ${(thumbnailUrl.length / 1024).toFixed(2)}KB`,
        );
      }
      if (description) {
        console.log(
          `[Events] Description size: ${(description.length / 1024).toFixed(2)}KB`,
        );
      }

      const eventSlug = toEventSlug(slug || title);

      // Check for duplicate slug
      const [existingRows] = await pool.query(
        "SELECT id FROM events WHERE slug = ? LIMIT 1",
        [eventSlug],
      );
      if (existingRows?.length) {
        return res.status(409).json({
          success: false,
          error: "Event slug already exists",
          message:
            "An event with this title already exists. Please use a different title.",
        });
      }

      // Prepare data with proper null handling
      const eventData = [
        eventSlug,
        String(title).trim(),
        tagline ? String(tagline).trim() : null,
        description ? String(description).trim() : null,
        category || "wellness",
        Array.isArray(tags) ? tags.join(", ") : tags ? String(tags) : null,
        templateType || null,
        date,
        endDate || null,
        Number(duration || 60),
        location ? String(location).trim() : isOnline ? "Online" : null,
        Boolean(isOnline),
        meetingLink ? String(meetingLink).trim() : null,
        Boolean(isPaid),
        isPaid ? Number(price || 0) : null,
        (currency || "KES").toString().toUpperCase(),
        paymentMethod || (isPaid ? "mpesa" : null),
        isPaid && earlyBirdPrice ? Number(earlyBirdPrice) : null,
        discountCode ? String(discountCode).trim() : null,
        isPaid && discountPercent ? Number(discountPercent) : null,
        capacity ? Number(capacity) : null,
        Boolean(isPrivate),
        Boolean(isRecurring),
        Boolean(allowAnonymous),
        Boolean(allowMaybe),
        Boolean(waitlistEnabled),
        Boolean(chatEnabled !== false),
        Boolean(recordingAllowed),
        Boolean(notifyEnrolled !== false),
        Boolean(remindOneHour !== false),
        Boolean(remindTenMinutes !== false),
        Boolean(recommendationsEnabled !== false),
        Boolean(featured),
        thumbnailUrl ? String(thumbnailUrl) : null,
        videoUrl ? String(videoUrl) : null,
        req.user.id,
      ];

      const [result] = await pool.query(
        `INSERT INTO events
                (slug, title, tagline, description, category, tags, template_type, date, end_date, duration, location, is_online, meeting_link, is_paid, price, currency, payment_method, early_bird_price, discount_code, discount_percent, capacity, is_private, is_recurring, allow_anonymous, allow_maybe, waitlist_enabled, chat_enabled, recording_allowed, send_invite_emails, reminder_one_hour, reminder_ten_minutes, recommendations_enabled, featured, thumbnail_url, video_url, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        eventData,
      );

      console.log(
        `[Events] Creation successful: ID ${result.insertId}, slug "${eventSlug}"`,
      );
      return res
        .status(201)
        .json({ success: true, id: result.insertId, slug: eventSlug });
    } catch (error) {
      console.error("Create event error:", error.message);
      console.error("Error code:", error.code);
      console.error("Error details:", error.sqlMessage || error.message);

      // Return more specific error messages
      if (
        error.code === "ER_DUP_ENTRY" ||
        error.message?.includes("slug already exists")
      ) {
        return res.status(409).json({
          success: false,
          error: "Event slug already exists",
          message:
            "An event with this title already exists. Please use a different title.",
        });
      }

      if (error.code === "ER_DATA_TOO_LONG") {
        return res.status(400).json({
          success: false,
          error: "Content too large",
          message:
            "One or more fields contain too much data. Please reduce the size of images, descriptions, or other large content.",
        });
      }

      if (
        error.code === "ER_PARSE_ERROR" ||
        error.message?.includes("syntax")
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid request format",
          message: "Please check all required fields are filled correctly.",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to create event",
        message:
          error.message || "An unexpected error occurred. Please try again.",
      });
    }
  },
);

app.post(
  "/api/events/:eventId/media",
  requireUnityUser,
  requireAdmin,
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const thumbnailUrl = (req.body?.thumbnailUrl || "").toString().trim();
      const videoUrl = (req.body?.videoUrl || "").toString().trim();

      if (!eventId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid event id" });
      }

      if (!thumbnailUrl && !videoUrl) {
        return res
          .status(400)
          .json({ success: false, error: "Provide thumbnailUrl or videoUrl" });
      }

      const [rows] = await pool.query(
        "SELECT id, thumbnail_url, video_url FROM events WHERE id = ? LIMIT 1",
        [eventId],
      );
      const eventRow = rows?.[0];
      if (!eventRow) {
        return res
          .status(404)
          .json({ success: false, error: "Event not found" });
      }

      await pool.query(
        "UPDATE events SET thumbnail_url = COALESCE(?, thumbnail_url), video_url = COALESCE(?, video_url) WHERE id = ?",
        [thumbnailUrl || null, videoUrl || null, eventId],
      );

      return res.json({
        success: true,
        eventId,
        thumbnail_url: thumbnailUrl || eventRow.thumbnail_url || null,
        video_url: videoUrl || eventRow.video_url || null,
        note: "Media URLs updated. If using Azure Blob, upload file there first and pass resulting URL here.",
      });
    } catch (error) {
      console.error("Event media update error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to update event media" });
    }
  },
);

app.post(
  "/api/events/:eventId/invites",
  requireEventsRsvpIdentity,
  requireAdminOrTherapist,
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const inviteEmails = Array.isArray(req.body?.emails)
        ? req.body.emails
        : [];
      const expiresInHours = Math.max(
        1,
        Number(req.body?.expiresInHours || 72),
      );

      if (!eventId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid event id" });
      }

      const [eventRows] = await pool.query(
        "SELECT id, is_private FROM events WHERE id = ? LIMIT 1",
        [eventId],
      );
      if (!eventRows?.length) {
        return res
          .status(404)
          .json({ success: false, error: "Event not found" });
      }

      if (!eventRows[0].is_private) {
        return res.status(400).json({
          success: false,
          error: "Invites are only available for private events",
        });
      }

      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
      const tokensToCreate = inviteEmails.length > 0 ? inviteEmails : [null];
      const createdInvites = [];

      for (const email of tokensToCreate) {
        const normalizedEmail = email
          ? String(email).toLowerCase().trim()
          : null;
        const token = crypto.randomBytes(24).toString("hex");

        await pool.query(
          "INSERT INTO invites (event_id, email, token, expires_at) VALUES (?, ?, ?, ?)",
          [eventId, normalizedEmail, token, expiresAt.toISOString()],
        );

        createdInvites.push({
          email: normalizedEmail,
          token,
          expires_at: expiresAt.toISOString(),
          invite_link: `${buildEventPublicLink(req, `private/${token}`)}`,
        });
      }

      return res.status(201).json({ success: true, invites: createdInvites });
    } catch (error) {
      console.error("Create event invite error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to create event invites" });
    }
  },
);

app.post(
  "/api/events/:eventId/rsvp",
  requireEventsRsvpIdentity,
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const status = (req.body?.status || "").toString().toLowerCase();
      const paid = Boolean(req.body?.paid);
      const redirectSource = (req.body?.redirectSource || "")
        .toString()
        .slice(0, 80);
      const redirectContextRaw = req.body?.redirectContext;
      const redirectContext = redirectContextRaw
        ? JSON.stringify(redirectContextRaw).slice(0, 2000)
        : null;

      if (!eventId || !["yes", "no", "maybe"].includes(status)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid RSVP payload" });
      }

      const [eventRows] = await pool.query(
        "SELECT id, capacity FROM events WHERE id = ? LIMIT 1",
        [eventId],
      );
      if (!eventRows?.length) {
        return res
          .status(404)
          .json({ success: false, error: "Event not found" });
      }

      // Ensure user exists in database (for Clerk-only users, create minimal record)
      let userId = req.user.id;
      if (!userId || userId === 0) {
        if (!req.user.clerkUserId || !req.user.email) {
          return res
            .status(401)
            .json({ success: false, error: "Authentication required" });
        }

        // Create minimal user record
        try {
          const [created] = await pool.query(
            "INSERT INTO users (name, email, clerk_user_id, auth_provider, email_verified, trusted) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
            [
              req.user.email.split("@")[0],
              req.user.email,
              req.user.clerkUserId,
              "clerk",
              true,
              false,
            ],
          );
          userId = created.insertId || created.affectedRows;

          // If insert didn't return an ID, fetch it by clerk_user_id
          if (!userId) {
            const [userRows] = await pool.query(
              "SELECT id FROM users WHERE clerk_user_id = ? LIMIT 1",
              [req.user.clerkUserId],
            );
            userId = userRows?.[0]?.id;
          }

          if (!userId) {
            return res
              .status(500)
              .json({ success: false, error: "Failed to create user record" });
          }
        } catch (userCreateError) {
          // User might exist now, try to fetch
          const [userRows] = await pool.query(
            "SELECT id FROM users WHERE clerk_user_id = ? OR email = ? LIMIT 1",
            [req.user.clerkUserId, req.user.email],
          );
          userId = userRows?.[0]?.id;

          if (!userId) {
            console.error(
              "Failed to create/fetch user for RSVP:",
              userCreateError,
            );
            return res
              .status(500)
              .json({ success: false, error: "Failed to create user record" });
          }
        }
      }

      const [existingRsvpRows] = await pool.query(
        "SELECT id, status FROM rsvps WHERE user_id = ? AND event_id = ? LIMIT 1",
        [userId, eventId],
      );
      if (existingRsvpRows?.length) {
        // User has already RSVP'd - enforce one RSVP per user per event
        const existingStatus = existingRsvpRows[0].status;
        if (existingStatus === "yes") {
          // Already committed to attending - don't allow changes
          return res.status(409).json({
            success: false,
            error:
              "You have already RSVP'd to this event. Your seat is reserved.",
          });
        }
        // If they previously said "no" or "maybe", allow them to update to "yes"
        if (status === "yes") {
          await pool.query(
            "UPDATE rsvps SET status = ?, paid = ?, redirect_source = ?, redirect_context = ?, clerk_user_id = ?, user_email_snapshot = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [
              status,
              paid,
              redirectSource || null,
              redirectContext,
              req.user.clerkUserId || null,
              req.user.email || null,
              existingRsvpRows[0].id,
            ],
          );
        } else {
          // Don't allow changing from yes to no/maybe, or other status changes
          return res.status(409).json({
            success: false,
            error: "Your RSVP status cannot be changed once confirmed.",
          });
        }
      } else {
        await pool.query(
          "INSERT INTO rsvps (user_id, event_id, status, paid, redirect_source, redirect_context, clerk_user_id, user_email_snapshot, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
          [
            userId,
            eventId,
            status,
            paid,
            redirectSource || null,
            redirectContext,
            req.user.clerkUserId || null,
            req.user.email || null,
          ],
        );
      }

      const [attendeeRows] = await pool.query(
        `SELECT
                COALESCE(SUM(CASE WHEN status = 'yes' THEN 1 ELSE 0 END), 0) AS attendees_count
             FROM rsvps
             WHERE event_id = ?`,
        [eventId],
      );

      const attendeesCount = Number(attendeeRows?.[0]?.attendees_count || 0);
      const capacity =
        eventRows[0].capacity !== null && eventRows[0].capacity !== undefined
          ? Number(eventRows[0].capacity)
          : null;

      return res.json({
        success: true,
        status,
        paid,
        attendees_count: attendeesCount,
        spots_left: capacity ? Math.max(capacity - attendeesCount, 0) : null,
      });
    } catch (error) {
      console.error("RSVP error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to save RSVP" });
    }
  },
);

app.get("/api/events/:eventId/messages", requireUnityUser, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid event id" });
    }

    const [rsvpRows] = await pool.query(
      `SELECT id
             FROM rsvps
             WHERE user_id = ? AND event_id = ? AND status = 'yes'
             LIMIT 1`,
      [req.user.id, eventId],
    );

    if (!rsvpRows?.length) {
      return res
        .status(403)
        .json({ success: false, error: "RSVP yes required to access chat" });
    }

    const [rows] = await pool.query(
      `SELECT em.id, em.event_id, em.user_id, em.message, em.created_at, u.name AS user_name
             FROM event_messages em
             LEFT JOIN users u ON u.id = em.user_id
             WHERE em.event_id = ?
             ORDER BY em.created_at ASC
             LIMIT 120`,
      [eventId],
    );

    return res.json({ success: true, messages: rows || [] });
  } catch (error) {
    console.error("Fetch event messages error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch event messages" });
  }
});

const isBuddieDebugAuthorized = (req) => {
  if (process.env.NODE_ENV !== "production") return true;
  const configuredToken = process.env.BUDDIE_DEBUG_TOKEN;
  if (!configuredToken) return false;
  const incomingToken = (req.headers["x-buddie-debug-token"] || "").toString();
  return incomingToken === configuredToken;
};

app.post("/api/buddie/debug-vibe", async (req, res) => {
  try {
    if (!isBuddieDebugAuthorized(req)) {
      return res
        .status(403)
        .json({ success: false, error: "Debug access denied" });
    }

    const { mood, message, history, userId } = req.body;
    const cleanedMessage = toSafeText(message);
    const memoryKey = resolveMemoryKey(req, userId);

    const kenyanDetection = await detectEmotionWithKenyanLayer(
      cleanedMessage,
      detectEmotion,
    );
    const emotionLabel = kenyanDetection.emotionLabel;
    const vibeProfile = detectUserVibe({
      message: cleanedMessage,
      mood,
      history,
    });
    const slangVibe = mapMoodToVibe(kenyanDetection.mood);
    if (slangVibe) vibeProfile.label = slangVibe;
    const mappedVibe = mapEmotionToVibe(emotionLabel);
    if (mappedVibe) vibeProfile.label = mappedVibe;

    const trendProfile = summarizeEmotionTrend(history);
    const distressLevel = detectDistressLevel({
      message: cleanedMessage,
      mood,
      history,
    });
    const toneInstruction = getToneByEmotion(emotionLabel, vibeProfile.label);
    const memoryContext = buildMemoryContext(memoryKey);
    const contextSummary = await summarizeContext(memoryKey);
    const similarMemories = await querySimilarMemory(
      memoryKey,
      cleanedMessage,
      3,
    );
    const profile = getProfile(memoryKey);

    return res.json({
      success: true,
      diagnostics: {
        sourceMessage: cleanedMessage,
        memoryKey,
        sheng: kenyanDetection,
        emotionLabel,
        vibe: vibeProfile,
        trend: trendProfile,
        distressLevel,
        toneInstruction,
        profile,
        memoryContext,
        contextSummary,
        similarMemories,
        hasRecentRepeatCandidate: cleanedMessage
          ? hasRecentlySaid(memoryKey, cleanedMessage)
          : false,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to inspect buddie signals" });
  }
});

// BUDDIE Response Endpoint
app.post("/api/buddie/respond", async (req, res) => {
  try {
    const { mood, note, message, history, intensity, userId } = req.body;
    const cleanedMessage = toSafeText(message);
    const memoryKey = resolveMemoryKey(req, userId);

    if (checkForCrisis(cleanedMessage)) {
      const crisisResponse = getCrisisResponse();
      rememberConversation(memoryKey, cleanedMessage, crisisResponse, "crisis");
      return res.json({
        success: true,
        message: crisisResponse,
        supportSuggestion: true,
      });
    }

    const kenyanDetection = await detectEmotionWithKenyanLayer(
      cleanedMessage,
      detectEmotion,
    );
    let emotionLabel = kenyanDetection.emotionLabel;
    const vibeProfile = detectUserVibe({
      message: cleanedMessage,
      mood,
      history,
    });
    const slangVibe = mapMoodToVibe(kenyanDetection.mood);
    if (slangVibe) vibeProfile.label = slangVibe;
    const mappedVibe = mapEmotionToVibe(emotionLabel);
    if (mappedVibe) vibeProfile.label = mappedVibe;
    const trendProfile = summarizeEmotionTrend(history);
    const distressLevel = detectDistressLevel({
      message: cleanedMessage,
      mood,
      history,
    });
    const memoryContext = buildMemoryContext(memoryKey);
    const contextSummary = await summarizeContext(memoryKey);

    const llmAnalysis = await analyzeMessageWithLLM({
      message: cleanedMessage,
      mood,
      note,
      intensity,
      history,
      memoryContext,
      contextSummary,
      distressLevel,
      fallbackEmotion: emotionLabel,
      fallbackVibe: vibeProfile.label,
    });

    if (llmAnalysis?.confidence >= 0.65 && llmAnalysis?.emotionLabel) {
      emotionLabel = llmAnalysis.emotionLabel;
      const llmMappedVibe = mapEmotionToVibe(llmAnalysis.emotionLabel);
      if (llmMappedVibe) vibeProfile.label = llmMappedVibe;
    }

    if (llmAnalysis?.intent === "avoidant") {
      vibeProfile.label = VIBE_LABELS.AVOIDANT;
    }

    const toneBase = getToneByEmotion(emotionLabel, vibeProfile.label);
    const toneInstruction = llmAnalysis?.recommendedTone
      ? `${toneBase}; ${llmAnalysis.recommendedTone}`
      : toneBase;

    await createEmbedding(memoryKey, cleanedMessage);
    const similarMemories = await querySimilarMemory(
      memoryKey,
      cleanedMessage,
      3,
    );
    const semanticMemory = similarMemories.length
      ? similarMemories.join(" | ")
      : "";

    const profile = getProfile(memoryKey);
    const profileContext = `name=${profile.name || "Friend"}, preferredTone=${profile.preferredTone || "friendly"}, favoriteTopics=${(profile.favoriteTopics || []).join(", ") || "none"}, recurringMoods=${(profile.recurringMoods || []).slice(-5).join(", ") || "none"}`;
    const kenyanSlangContext = kenyanDetection.meaning
      ? `${kenyanDetection.meaning} (source=${kenyanDetection.source}, mood=${kenyanDetection.mood})`
      : `source=${kenyanDetection.source}, mood=${kenyanDetection.mood}`;

    if (kenyanDetection.safetyFlag === "self_harm_like") {
      const bridge = getKenyanCrisisBridgeResponse();
      const crisisResponse = `${bridge} Please reach out now: 1199 (Red Cross), +254 722 178 177 (Befrienders Kenya), or UNITY WITHIN Support at +254 715 765 561.`;
      rememberConversation(memoryKey, cleanedMessage, crisisResponse, "crisis");
      return res.json({
        success: true,
        message: crisisResponse,
        supportSuggestion: true,
      });
    }

    if (distressLevel === "severe") {
      const crisisResponse =
        "I’m really glad you told me this. You matter deeply 🤍 Please reach out right now: in Kenya call 1199 (Red Cross) or +254 722 178 177 (Befrienders Kenya), or contact UNITY WITHIN Support at +254 715 765 561. If you are in immediate danger, call local emergency services now.";
      rememberConversation(
        memoryKey,
        cleanedMessage,
        crisisResponse,
        emotionLabel || vibeProfile.label,
      );
      return res.json({
        success: true,
        message: crisisResponse,
        supportSuggestion: true,
      });
    }

    const userPrompt = buildBuddieUserPrompt({
      message: cleanedMessage,
      mood,
      note,
      intensity,
      history,
      vibeProfile,
      trendProfile,
      distressLevel,
      memoryContext,
      emotionLabel,
      contextSummary,
      toneInstruction,
      profileContext,
      semanticMemory,
      kenyanSlangContext,
      llmAnalysis,
    });

    const aiReply = await buddieAI(
      userPrompt,
      emotionLabel,
      vibeProfile.label,
      memoryKey,
    );

    if (aiReply) {
      const adaptiveFallback = hasRecentlySaid(memoryKey, aiReply)
        ? getAdaptiveFallback({
            kenyanDetection,
            emotionLabel,
            vibeLabel: vibeProfile.label,
            memoryKey,
            userMessage: cleanedMessage,
          })
        : null;
      const safeAiResponse = adaptiveFallback || aiReply;
      rememberConversation(
        memoryKey,
        cleanedMessage,
        safeAiResponse,
        emotionLabel || vibeProfile.label,
      );
      updateProfileFromInteraction(
        memoryKey,
        cleanedMessage,
        emotionLabel || vibeProfile.label,
        toneInstruction,
      );
      const supportSuggestion = shouldSuggestProfessionalSupport({
        distressLevel,
        llmAnalysis,
        cleanedMessage,
      });
      return res.json({
        success: true,
        message: safeAiResponse,
        supportSuggestion,
      });
    }

    // If AI providers are down, still respond using calibrated local fallback
    // so Buddie never appears silent to the user.
    const localFallback =
      getAdaptiveFallback({
        kenyanDetection,
        emotionLabel,
        vibeLabel: vibeProfile.label,
        memoryKey,
        userMessage: cleanedMessage,
      }) ||
      "I'm here with you. Tell me a little more about what's on your mind right now.";

    rememberConversation(
      memoryKey,
      cleanedMessage,
      localFallback,
      emotionLabel || vibeProfile.label,
    );
    updateProfileFromInteraction(
      memoryKey,
      cleanedMessage,
      emotionLabel || vibeProfile.label,
      toneInstruction,
    );
    return res.json({
      success: true,
      message: localFallback,
      supportSuggestion: shouldSuggestProfessionalSupport({
        distressLevel,
        llmAnalysis,
        cleanedMessage,
      }),
    });
  } catch (error) {
    console.error("Buddie error:", error);
    return res.status(503).json({
      success: false,
      error: AI_UNREACHABLE_MESSAGE,
    });
  }
});

// AI Service Endpoints (Affirmations, Reframing, etc.)
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!toSafeText(message)) {
      return res.status(400).json({ success: false, error: "Missing message" });
    }

    const reply = await getAIResponse(message);
    return res.json({ success: true, reply });
  } catch (error) {
    console.error("AI chat router error:", error);
    return res.status(500).json({ success: false, error: "AI system failed" });
  }
});

app.post("/api/ai/affirmation", async (req, res) => {
  const { mood } = req.body;
  const prompt = `The user is feeling "${mood}". Write a short, beautiful, comforting daily affirmation (max 20 words) for them. No quotes, just the affirmation.`;

  const aiResponse = await callAI(prompt, "You are a supportive companion.");

  if (aiResponse) {
    return res.json({ success: true, text: aiResponse });
  }

  res.json({ success: true, text: "You are enough, exactly as you are." });
});

app.post("/api/ai/educational", async (req, res) => {
  const getFallbackEducationalContent = (topicTitle) => {
    const normalizedTitle = (topicTitle || "").trim().toLowerCase();

    if (normalizedTitle.includes("anxiety")) {
      return {
        synthesis: `Anxiety is your body\'s built-in alarm system. In small doses, it can help you prepare for challenges. But when the alarm stays on for too long, it can feel overwhelming and affect sleep, focus, relationships, and confidence.

Common signs include racing thoughts, chest tightness, restlessness, stomach discomfort, irritability, and constant "what if" thinking. These symptoms are real and valid—they are not a sign of weakness.

Here are practical, expert-backed ways to respond:

1. **Name what is happening**  
   Say to yourself: "I\'m feeling anxious right now." Naming emotions can reduce their intensity and helps your brain shift from panic to awareness.

2. **Regulate your body first**  
   Try slow breathing (inhale for 4, exhale for 6) for 1-2 minutes. A longer exhale signals safety to your nervous system.

3. **Shrink the problem to one next step**  
   Anxiety grows with uncertainty. Write one tiny action (send one message, open one page, drink water) and do only that step.

4. **Challenge anxious predictions gently**  
   Ask: "What evidence do I have?" and "What is a more balanced possibility?" This helps break catastrophic thinking loops.

5. **Build daily protection habits**  
   Consistent sleep, movement, less caffeine, and talking to someone you trust can reduce overall anxiety intensity over time.

If anxiety is frequent, intense, or interfering with daily life, reaching out to a licensed mental health professional is a strong and healthy next step. You deserve support, and recovery is possible one small step at a time.`,
        sources: [
          {
            name: "Mayo Clinic",
            url: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961",
          },
          {
            name: "Healthline",
            url: "https://www.healthline.com/health/anxiety",
          },
          {
            name: "Verywell Mind",
            url: "https://www.verywellmind.com/what-is-anxiety-2795188",
          },
        ],
      };
    }

    return {
      synthesis:
        "We couldn't generate a deep guide right now, but please check these trusted sources for more information.",
      sources: [
        {
          name: "Psychology Today",
          url: `https://www.psychologytoday.com/us/archive?search=${(topicTitle || "Mental Health").replace(/ /g, "+")}`,
        },
        {
          name: "Healthline",
          url: `https://www.healthline.com/search?q=${(topicTitle || "Mental Health").replace(/ /g, "+")}`,
        },
        {
          name: "VeryWell Mind",
          url: `https://www.verywellmind.com/search?q=${(topicTitle || "Mental Health").replace(/ /g, "+")}`,
        },
      ],
    };
  };

  const shouldUseFallback = (synthesis) => {
    if (!synthesis || typeof synthesis !== "string") return true;

    const normalized = synthesis.toLowerCase().trim();
    return (
      normalized.length < 120 ||
      normalized.includes("we couldn't generate a deep guide right now") ||
      normalized.includes("content currently unavailable") ||
      normalized.includes("unable to load content at this moment")
    );
  };

  try {
    const { topicTitle } = req.body;
    if (!topicTitle)
      return res.status(400).json({ error: "Missing topicTitle" });

    const prompt = `
        Analyze information about "${topicTitle}" from verified mental health authorities:
        - Psychology Today (psychologytoday.com)
        - Healthline (healthline.com)
        - VeryWell Mind (verywellmind.com)
        - Mayo Clinic (mayoclinic.org)
        - Harvard Health (health.harvard.edu)

        Task:
        1. Synthesize the most common and effective advice from at least three of these sources into a "best-of" deep guide.
        2. Ensure the tone is empathetic, deep, and grounded.
        3. Include 3 STRICTLY REAL, WORKING URL links as sources. 
        4. IMPORTANT: If you are not 100% sure of a specific article's deep-link slug, you MUST provide a search/category link for that topic on the trusted site instead (e.g., "https://www.healthline.com/search?q=${topicTitle.replace(/ /g, "+")}").
        5. Do NOT use placeholder URLs like example.com.
        6. Format the output as JSON.

        Output format:
        {
          "title": "${topicTitle}",
          "synthesis": "Markdown formatted content (approx 300-400 words). Include a deep definition, 3-5 expert-backed tips, and a soothing conclusion.",
          "sources": [
            {"name": "Psychology Today", "url": "https://www.psychologytoday.com/us/archive?search=${topicTitle.replace(/ /g, "+")}"},
            {"name": "Healthline", "url": "https://www.healthline.com/search?q=${topicTitle.replace(/ /g, "+")}"},
            {"name": "VeryWell Mind", "url": "https://www.verywellmind.com/search?q=${topicTitle.replace(/ /g, "+")}"}
          ]
        }
        `;

    const data = await callAI(prompt, "You are a mental health researcher.", {
      json: true,
    });

    if (data) {
      const title = data.title || topicTitle;
      const fallback = getFallbackEducationalContent(title);
      const useFallback = shouldUseFallback(data.synthesis);

      return res.json({
        success: true,
        title,
        synthesis: useFallback ? fallback.synthesis : data.synthesis,
        sources:
          Array.isArray(data.sources) && data.sources.length > 0
            ? data.sources
            : fallback.sources,
      });
    }

    throw new Error("AI failed to provide educational content");
  } catch (error) {
    console.error("Educational AI error:", error);
    const title = req.body.topicTitle || "Mental Health";
    const fallback = getFallbackEducationalContent(title);
    res.json({
      success: true,
      title: title,
      synthesis: fallback.synthesis,
      sources: fallback.sources,
    });
  }
});

app.get("/api/ai/insights", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const [moods] = await pool.query(
      "SELECT mood, intensity, note, created_at FROM user_moods WHERE user_id = ? AND created_at >= NOW() - INTERVAL 14 DAY ORDER BY created_at DESC",
      [userId],
    );
    const [journals] = await pool.query(
      "SELECT content, created_at FROM journal_entries WHERE user_id = ? AND created_at >= NOW() - INTERVAL 14 DAY ORDER BY created_at DESC",
      [userId],
    );
    const [wins] = await pool.query(
      "SELECT content, created_at FROM tiny_wins WHERE user_id = ? AND created_at >= NOW() - INTERVAL 14 DAY ORDER BY created_at DESC",
      [userId],
    );

    if (moods.length === 0 && journals.length === 0) {
      return res.json({
        success: true,
        insights: [
          {
            type: "PATTERN",
            title: "Starting Your Journey",
            text: "Log your mood for a few days so I can help identify your unique emotional patterns.",
          },
          {
            type: "SUGGESTION",
            title: "Daily Ritual",
            text: "Try recording one small win today to start building your resilience bank.",
          },
          {
            type: "WARNING",
            title: "Stay Consistent",
            text: "Regular check-ins help us catch early signs of stress before they grow.",
          },
        ],
      });
    }

    const context = `
            User Data (Last 14 Days):
            Moods: ${JSON.stringify(moods)}
            Journals: ${JSON.stringify(journals)}
            Tiny Wins: ${JSON.stringify(wins)}
        `;

    const prompt = `
            As an empathetic mental health AI analyst for youth, analyze this data and provide 3 distinct insights.
            1. Pattern Detection: Identify a correlation (e.g., mood dips, certain times, link between journals and moods).
            2. Personalized Suggestion: One specific micro-action based on their data.
            3. Early Warning: Identify if stress is rising or if they haven't logged positive things lately.
            Data: ${context}
            Output MUST be JSON format exactly like this:
            {
                "insights": [
                    {"type": "PATTERN", "title": "Insight Title", "text": "Insight description..."},
                    {"type": "SUGGESTION", "title": "Insight Title", "text": "Insight description..."},
                    {"type": "WARNING", "title": "Insight Title", "text": "Insight description..."}
                ]
            }
        `;

    const data = await callAI(prompt, "You are a mental health data analyst.", {
      json: true,
    });

    if (data && data.insights) {
      return res.json({ success: true, ...data });
    }

    throw new Error("AI failed to provide insights");
  } catch (error) {
    console.error("Insights AI error:", error);
    res.json({
      success: true,
      insights: [
        {
          type: "PATTERN",
          title: "Keep Going",
          text: "Tracking your data regularly helps us unlock more insights for you.",
        },
        {
          type: "SUGGESTION",
          title: "Practice Mindfulness",
          text: "Take 5 minutes today to practice deep breathing.",
        },
        {
          type: "WARNING",
          title: "Data Insight",
          text: "We need more data to provide deep personalized patterns.",
        },
      ],
    });
  }
});

app.post("/api/ai/reframe", async (req, res) => {
  const { anxiousThought } = req.body;
  const prompt = `The user has this anxious thought: "${anxiousThought}". 
    Provide a gentle, non-clinical, and compassionate reframe. 
    Start with "Try looking at it this way:" 
    Keep it under 40 words.`;

  const aiResponse = await callAI(prompt, "You are a compassionate companion.");

  if (aiResponse) {
    return res.json({ success: true, text: aiResponse });
  }

  res.json({
    success: true,
    text: "It is okay to feel this way, but remember that thoughts are not always facts.",
  });
});

app.post("/api/ai/values-affirmation", async (req, res) => {
  const { values } = req.body;
  const prompt = `The user values: ${values.join(", ")}. 
    Write a short, gentle guiding statement (under 30 words) to help them feel direction and purpose based on these values.
    Tone: Warm, hopeful, grounding.`;

  const aiResponse = await callAI(prompt, "You are a supportive companion.");

  if (aiResponse) {
    return res.json({ success: true, text: aiResponse });
  }

  res.json({
    success: true,
    text: "Your values are your compass. Trust them to guide you forward.",
  });
});

// --- Community Auto-Join Route ---
app.get("/community/:slug", async (req, res) => {
  const { slug } = req.params;
  const [communities] = await pool.query(
    "SELECT * FROM communities WHERE slug = ?",
    [slug],
  );
  const community = communities[0];
  if (!community) return res.status(404).send("Community not found");
  if (!req.session || !req.session.user) {
    return res.redirect(`/login?redirect=/community/${slug}`);
  }
  await pool.query(
    `INSERT INTO community_members (community_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
    [community.id, req.session.user.id],
  );
  res.redirect(`/community/${community.id}`);
});

// --- Dynamic Open Graph meta tags for community social previews ---
app.get("/og/community/:slug", async (req, res) => {
  const { slug } = req.params;
  const [communities] = await pool.query(
    "SELECT * FROM communities WHERE slug = ?",
    [slug],
  );
  const community = communities[0];
  if (!community) return res.status(404).send("Community not found");
  const ogTitle = `Join ${community.name} on UnityWithin!`;
  const ogDesc = `Connect, share and collaborate with members of ${community.name}.`;
  const ogImage = "https://unitywithin.app/images/community-preview.png";
  const ogUrl = `https://unitywithin.app/community/${community.slug}`;
  res.set("Content-Type", "text/html");
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${ogTitle}</title>
            <meta property="og:title" content="${ogTitle}" />
            <meta property="og:description" content="${ogDesc}" />
            <meta property="og:image" content="${ogImage}" />
            <meta property="og:url" content="${ogUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${ogTitle}" />
            <meta name="twitter:description" content="${ogDesc}" />
            <meta name="twitter:image" content="${ogImage}" />
            <meta http-equiv="refresh" content="0; url=${ogUrl}" />
        </head>
        <body>
            <p>Redirecting to community...</p>
        </body>
        </html>
    `);
});

// --- Buddy Invite Auto-Join Route ---
app.get("/buddy/:code", async (req, res) => {
  const { code } = req.params;
  const [invites] = await pool.query(
    "SELECT * FROM buddy_invites WHERE invite_code = ?",
    [code],
  );
  const invite = invites[0];
  if (!invite) return res.status(404).send("Invalid invite");
  if (!req.session || !req.session.user) {
    return res.redirect(`/login?redirect=/buddy/${code}`);
  }
  await pool.query(
    `INSERT INTO buddies (user_id, buddy_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE buddy_id = VALUES(buddy_id)`,
    [req.session.user.id, invite.inviter_id],
  );
  await pool.query("UPDATE buddy_invites SET uses = uses + 1 WHERE id = ?", [
    invite.id,
  ]);
  res.redirect("/buddy");
});

// Serve uploaded files (event thumbnails, etc.)
app.use("/uploads", express.static(UPLOADS_DIR));

// Serve React frontend static files in production
const resolveStaticDistPath = () => {
  const candidates = [];

  if (process.env.STATIC_FILES_PATH) {
    const configuredPath = path.isAbsolute(process.env.STATIC_FILES_PATH)
      ? process.env.STATIC_FILES_PATH
      : path.resolve(__dirname, process.env.STATIC_FILES_PATH);
    candidates.push(configuredPath);
  }

  candidates.push(path.resolve(__dirname, "dist"));
  candidates.push(path.resolve(__dirname, "../dist"));

  const uniqueCandidates = [...new Set(candidates)];

  const shellPriority = ["main.html", "events.html", "index.html"];
  const validCandidates = uniqueCandidates
    .map((candidatePath) => {
      if (!fs.existsSync(candidatePath)) {
        return null;
      }

      const shellFile = shellPriority.find((fileName) =>
        fs.existsSync(path.join(candidatePath, fileName)),
      );
      if (!shellFile) {
        return null;
      }

      const shellStats = fs.statSync(path.join(candidatePath, shellFile));
      return {
        candidatePath,
        shellMtimeMs: shellStats.mtimeMs,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.shellMtimeMs - a.shellMtimeMs);

  if (validCandidates.length > 0) {
    return validCandidates[0].candidatePath;
  }

  return path.resolve(__dirname, "dist");
};

const distPath = resolveStaticDistPath();
console.log(`Serving static files from: ${distPath}`);

app.use(express.static(distPath));

const resolveShellForRequest = (req) => {
  const hostHeader = String(
    req.headers["x-forwarded-host"] || req.headers.host || "",
  ).toLowerCase();
  const host = hostHeader.split(",")[0].trim().split(":")[0];
  const prefersEventsShell = host.startsWith("events.");

  const shellCandidates = prefersEventsShell
    ? ["events.html", "main.html", "index.html"]
    : ["main.html", "index.html", "events.html"];

  for (const shellFile of shellCandidates) {
    const shellPath = path.join(distPath, shellFile);
    if (fs.existsSync(shellPath)) {
      return shellPath;
    }
  }

  return path.join(distPath, "index.html");
};

// SPA fallback: serve app shell for non-API routes and keep asset 404s intact.
app.get(/^(?!\/api).*/, (req, res, next) => {
  const pathHasExtension = path.extname(req.path || "") !== "";
  const acceptsHtml = String(req.headers.accept || "").includes("text/html");

  if (pathHasExtension || !acceptsHtml) {
    return next();
  }

  res.sendFile(resolveShellForRequest(req));
});

// Start server
validateProductionConfig();

server.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

  // Test database connection
  console.log("\n📊 Initializing database...");
  await testConnection();
  await initializeDatabase();

  console.log(`\n✅ Application ready at http://localhost:${PORT}`);
});
