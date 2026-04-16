import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    return null;
  }
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(text) {
  if (!text || typeof text !== "string") {
    return text;
  }

  const key = getEncryptionKey();
  if (!key) {
    return text;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    const ivHex = iv.toString("hex");
    const authTagHex = authTag.toString("hex");

    return `${ivHex}:${authTagHex}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error.message);
    return text;
  }
}

export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== "string") {
    return encryptedText;
  }

  const key = getEncryptionKey();
  if (!key) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText;
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    return encryptedText;
  }
}

export function hashPassword(password) {
  if (!password) return "";
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
}

export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("base64url");
}

export function hashEmail(email) {
  if (!email || typeof email !== "string") return "";
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 16);
}

export default {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashEmail,
  getEncryptionKey,
};