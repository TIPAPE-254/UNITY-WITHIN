import { pool } from "./db.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.APPSETTING_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || process.env.APPSETTING_VAPID_PRIVATE_KEY || "";

function getVapidKeys() {
  return {
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  };
}

export function setupPushNotifications(app) {
  if (!app) return;

  app.get("/api/push/vapid-public-key", (req, res) => {
    const keys = getVapidKeys();
    if (!keys.publicKey) {
      return res.status(503).json({ error: "Push not configured" });
    }
    res.json({ publicKey: keys.publicKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, userId } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "Invalid subscription" });
      }

      const { endpoint, keys } = subscription;

      if (userId) {
        await pool.query(
          `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE endpoint = VALUES(endpoint), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
          [userId, endpoint, keys?.p256dh || "", keys?.auth || ""]
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.delete("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint, userId } = req.body;

      if (userId && endpoint) {
        await pool.query("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?", [userId, endpoint]);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  console.log("✅ Push notification endpoints registered");
}

export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    let rows = [];
    [rows] = await pool.query("SELECT * FROM push_subscriptions WHERE user_id = ?", [userId]);

    if (rows.length === 0) {
      return false;
    }

    const notifications = [];
    for (const sub of rows) {
      notifications.push({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      });
    }

    console.log(`📬 Would send push to user ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error("Send push error:", error);
    return false;
  }
}

export default {
  setupPushNotifications,
  sendPushNotification,
  getVapidKeys,
};