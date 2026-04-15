/**
 * encryption.js — AES-256-CBC encryption utilities
 * Used for encrypting/decrypting sensitive values like admin email.
 *
 * To encrypt your admin email, run once locally:
 *   node -e "
 *     import('./server/encryption.js').then(({encrypt}) => console.log(encrypt('admin@example.com')));
 *   "
 * Then set in Azure App Settings:
 *   ENCRYPTED_ADMIN_EMAIL = <output>
 *   ENCRYPTION_KEY = <your 32-char key, same as used to encrypt>
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey() {
    const key = process.env.ENCRYPTION_KEY || process.env.APPSETTING_ENCRYPTION_KEY || '';
    if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set');
    // Pad or truncate to exactly 32 bytes for AES-256
    return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

/**
 * Encrypts a plaintext string.
 * @param {string} text
 * @returns {string} hex-encoded iv:ciphertext
 */
export function encrypt(text) {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a value produced by encrypt().
 * @param {string} encryptedText - hex-encoded iv:ciphertext
 * @returns {string} plaintext
 */
export function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) {
        throw new Error('Invalid encrypted value format — expected iv:ciphertext');
    }
    const key = getKey();
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
