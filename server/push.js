/**
 * push.js — Web Push Notifications setup
 * Registers API routes for VAPID-based push notification subscriptions.
 */

import webpush from 'web-push';

const readEnv = (key) => process.env[key] || process.env[`APPSETTING_${key}`] || '';

/**
 * Sets up push notification routes on the Express app.
 * @param {import('express').Application} app
 */
export function setupPushNotifications(app) {
    const vapidPublicKey = readEnv('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = readEnv('VAPID_PRIVATE_KEY');
    const vapidEmail = readEnv('BREVO_FROM_EMAIL') || 'hello@unitywithin.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('⚠️ VAPID keys not configured. Push notifications disabled.');
        // Still register routes so the app doesn't crash on subscription attempts
        app.get('/api/push/vapid-public-key', (req, res) => {
            res.status(503).json({ success: false, error: 'Push notifications not configured' });
        });
        app.post('/api/push/subscribe', (req, res) => {
            res.status(503).json({ success: false, error: 'Push notifications not configured' });
        });
        return;
    }

    try {
        webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);
        console.log('✅ Web Push (VAPID) initialized');
    } catch (e) {
        console.error('❌ Failed to initialize VAPID:', e.message);
        return;
    }

    // In-memory store (use a DB table for production persistence)
    const subscriptions = new Map();

    app.get('/api/push/vapid-public-key', (req, res) => {
        res.json({ publicKey: vapidPublicKey });
    });

    app.post('/api/push/subscribe', (req, res) => {
        try {
            const { subscription, userId } = req.body;
            if (!subscription || !subscription.endpoint) {
                return res.status(400).json({ success: false, error: 'Invalid subscription object' });
            }
            const key = userId ? String(userId) : subscription.endpoint;
            subscriptions.set(key, subscription);
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    });

    app.post('/api/push/unsubscribe', (req, res) => {
        try {
            const { userId, endpoint } = req.body;
            const key = userId ? String(userId) : endpoint;
            if (key) subscriptions.delete(key);
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    });
}
