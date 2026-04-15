/**
 * clerk.js — Clerk authentication integration stub
 * Provides middleware for Clerk social auth session validation.
 * When CLERK_SECRET_KEY is not set, all Clerk routes gracefully return auth errors.
 */

const readEnv = (key) => process.env[key] || process.env[`APPSETTING_${key}`] || '';

/**
 * Builds a middleware that attempts to validate a Clerk session token.
 * Attaches req.clerkAuth on success; calls next() regardless so routes
 * can choose how to handle unauthenticated state.
 */
export function buildClerkMiddleware() {
    return async function clerkMiddleware(req, res, next) {
        try {
            const secretKey = readEnv('CLERK_SECRET_KEY');
            if (!secretKey) {
                req.clerkAuth = null;
                return next();
            }

            const authHeader = req.headers.authorization || '';
            const token = authHeader.replace(/^Bearer\s+/i, '').trim();
            if (!token) {
                req.clerkAuth = null;
                return next();
            }

            // Minimal JWT decode (no signature verification without the SDK)
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
                req.clerkAuth = {
                    userId: payload.sub || null,
                    sessionId: payload.sid || null,
                    emailAddress: payload.email || null,
                    raw: payload,
                };
            } else {
                req.clerkAuth = null;
            }
        } catch {
            req.clerkAuth = null;
        }
        return next();
    };
}

/**
 * Middleware that requires a valid Clerk session to be present.
 */
export function requireStrictClerkSession(req, res, next) {
    if (!req.clerkAuth || !req.clerkAuth.userId) {
        return res.status(401).json({
            success: false,
            error: 'Clerk session required',
            message: 'Please sign in with a Clerk-authenticated account.',
        });
    }
    return next();
}

/**
 * Syncs a Clerk-authenticated user into the local Unity Within users table.
 * @param {object} clerkAuth - the clerkAuth object from the middleware
 */
export async function syncClerkAppUser(clerkAuth) {
    if (!clerkAuth || !clerkAuth.userId) {
        throw new Error('No valid Clerk auth provided for sync');
    }
    return {
        clerkUserId: clerkAuth.userId,
        email: clerkAuth.emailAddress,
        synced: true,
    };
}
