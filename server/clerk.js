import crypto from "crypto";
import { pool } from "./db.js";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "";
const CLERK_JWT_KEY = process.env.CLERK_JWT_KEY || "";

function getClerkSecret() {
  return CLERK_SECRET_KEY;
}

function getClerkJwtKey() {
  return CLERK_JWT_KEY;
}

function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload;
  } catch (e) {
    return null;
  }
}

export function buildClerkMiddleware() {
  return async function socialClerkMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.slice(7);
    const payload = parseJwtPayload(token);
    
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.clerkAuth = {
      userId: payload.sub,
      sessionId: payload.sid || null,
      emailAddress: payload.email || payload.email_address || null,
    };
    
    next();
  };
}

export function requireStrictClerkSession(req, res, next) {
  if (!req.clerkAuth || !req.clerkAuth.userId) {
    return res.status(401).json({ error: "Clerk session required" });
  }
  next();
}

export async function syncClerkAppUser(clerkAuth) {
  if (!clerkAuth || !clerkAuth.userId) {
    throw new Error("Invalid clerk auth data");
  }

  const userId = String(clerkAuth.userId).trim();
  const email = String(clerkAuth.emailAddress || "").trim();

  if (!userId) {
    throw new Error("Clerk user ID is required");
  }

  let result = null;
  try {
    result = await pool.query(
      "SELECT * FROM users WHERE clerk_user_id = $1 LIMIT 1",
      [userId]
    );
  } catch (e) {
    console.error("Database query error:", e);
  }

  if (result && result.rows && result.rows.length > 0) {
    return result.rows[0];
  }

  if (!email) {
    throw new Error("Email required for new user creation");
  }

  let existingResult = null;
  try {
    existingResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
  } catch (e) {
    existingResult = null;
  }

  if (existingResult && existingResult.rows && existingResult.rows.length > 0) {
    await pool.query(
      "UPDATE users SET clerk_user_id = $1, auth_provider = 'clerk' WHERE id = $2",
      [userId, existingResult.rows[0].id]
    );
    const updatedResult = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [existingResult.rows[0].id]);
    return updatedResult.rows[0];
  }

  const insertResult = await pool.query(
    `INSERT INTO users (name, email, clerk_user_id, auth_provider, email_verified, trusted, profile_image, created_at) 
     VALUES ($1, $2, $3, 'clerk', true, false, '', NOW()) RETURNING id`,
    [email.split("@")[0], email, userId]
  );

  const newUserId = insertResult.rows[0].id;
  const finalResult = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [newUserId]);
  return finalResult.rows[0];
}

export async function getClerkUser(clerkUserId) {
  if (!clerkUserId) return null;
  
  let result = null;
  try {
    result = await pool.query(
      "SELECT * FROM users WHERE clerk_user_id = $1 LIMIT 1",
      [clerkUserId]
    );
  } catch (e) {
    return null;
  }
  
  return result && result.rows && result.rows.length > 0 ? result.rows[0] : null;
}

export async function linkClerkUser(userId, clerkUserId) {
  if (!userId || !clerkUserId) return false;
  
  await pool.query(
    "UPDATE users SET clerk_user_id = $1, auth_provider = 'clerk' WHERE id = $2",
    [clerkUserId, userId]
  );
  return true;
}

export default {
  buildClerkMiddleware,
  requireStrictClerkSession,
  syncClerkAppUser,
  getClerkUser,
  linkClerkUser,
  getClerkSecret,
  getClerkJwtKey,
};