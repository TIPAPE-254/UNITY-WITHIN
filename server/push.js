// --- INTELLIGENT NOTIFICATION ALGORITHM IMPORT ---
import { generateNotification } from '../services/pushNotificationService.js';
/**
 * Intelligent notification endpoint (AI-driven, personalized)
 */
async function intelligentNotifyHandler(req, res) {
  try {
    const { userId, userProfile } = req.body;
    if (!userId || !userProfile) {
      return res.status(400).json({ error: 'userId and userProfile required' });
    }
    // Generate intelligent notification message
    const body = generateNotification(userProfile);
    const payload = JSON.stringify({
      title: 'UNITY WITHIN',
      body,
      action: 'intelligent',
      tag: `intelligent_${Date.now()}`,
      id: `intelligent_${Date.now()}`
    });
    // Send only to this user's subscription(s)
    let sent = 0, failed = 0;
    subscriptions.forEach((data, endpoint) => {
      if (data.subscription.userId === userId) {
        webpush.sendNotification(data.subscription, payload)
          .then(() => { sent++; })
          .catch(() => { failed++; });
      }
    });
    res.json({ message: 'Intelligent notification sent', sent, failed });
  } catch (error) {
    console.error('[Push Server] Intelligent notify error:', error);
    res.status(500).json({ error: 'Failed to send intelligent notification' });
  }
}

/**
 * Push Notification Module for Unity Within
 * Emotionally Intelligent Notifications System
 * 
 * This module handles Web Push subscriptions and sends emotionally intelligent,
 * revenue-driving, and engagement-boosting notifications that feel like a caring
 * companion rather than a sales pitch.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import bodyParser from 'body-parser';
import cors from 'cors';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// VAPID keys for Web Push - read from environment variables
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

// In-memory storage (replace with database in production)
const subscriptions = new Map();
const userMoodHistory = new Map(); // Track user moods for intelligent notifications
const userLastActive = new Map(); // Track user activity

// Default notification preferences - ALL ENABLED by default (user can opt-out)
const DEFAULT_PREFERENCES = {
  moodReminder: true,
  journalReminder: true,
  eventReminder: true,
  breatheReminder: true,
  gratitudeReminder: true,
  therapistSuggestions: true,
  progressUpdates: true,
  careDrops: true,
  moodTime: '09:00',
  journalTime: '20:00',
  breatheTime: '12:00'
};

// Configure VAPID if keys are available
if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:tipapematayo@gmail.com',
    publicVapidKey,
    privateVapidKey
  );
  console.log('[Push Notifications] VAPID keys configured successfully');
} else {
  console.warn('[Push Notifications] Warning: VAPID keys not configured. Push notifications will not work.');
}

// ==================== NOTIFICATION TEMPLATES ====================

// Emotionally intelligent notification messages
const NOTIFICATION_TEMPLATES = {
  // 🎉 Welcome Notifications for New Users
  welcome: [
    { title: "Welcome to Unity Within 💛", body: "You've taken a brave first step. We're here for you, every breath of the way." },
    { title: "You belong here 💙", body: "Welcome to your safe space. Take a deep breath - you're among friends here." },
    { title: "Hello, beautiful soul 🌟", body: "Welcome to Unity Within. Your journey to healing starts here, and you're not alone." },
    { title: "So glad you're here 💜", body: "Welcome! This is your space to breathe, feel, and grow. Let's begin this journey together." },
    { title: "A warm welcome to you 🤗", body: "You've found your safe haven. Take your time, be gentle with yourself, and know we're here." }
  ],

  // 🧠 Emotionally Intelligent Notifications
  emotionalSupport: {
    low: [
      { title: "It's okay to feel this way 💙", body: "You don't have to carry it alone. Want to talk to someone who understands?" },
      { title: "We're here for you", body: "Bad days don't last. Would a session with a therapist help today?" },
      { title: "You matter 💜", body: "Your feelings are valid. Let's work through this together." }
    ],
    improving: [
      { title: "You seem calmer today 🌱", body: "That's growth. Keep going - you're doing great!" },
      { title: "Notice the progress? 💪", body: "You're building resilience. Celebrate this moment." },
      { title: "Growth in action ✨", body: "You're handling things better. That's worth acknowledging." }
    ],
    lateNight: [
      { title: "Can't sleep? 🌙", body: "Let's slow things down together. Try a breathing exercise." },
      { title: "Rest is important 💤", body: "Put the phone down and be gentle with yourself tonight." }
    ],
    silent: [
      { title: "We haven't heard from you 💙", body: "Just checking in. How are you really doing?" },
      { title: "You've been quiet lately", body: "Your journey matters. Want to pick up where you left off?" },
      { title: "We miss you 🌟", body: "Your progress is important. Come back when you're ready." }
    ]
  },

  // 💰 Revenue-Driving Notifications (Subtle)
  revenue: {
    therapistMatch: [
      { title: "A therapist who gets you 💙", body: "Based on your recent check-ins, Sarah could really help today." },
      { title: "The right support at the right time", body: "You've been feeling overwhelmed. A session could help." }
    ],
    scarcity: [
      { title: "Limited availability today ⏰", body: "Only 2 sessions left with top-rated therapists." },
      { title: "Spots filling up fast", body: "Don't wait - secure your session before they're gone." }
    ],
    firstPaid: [
      { title: "Your next step awaits 🌱", body: "Your first premium session is ready when you are." },
      { title: "Ready to go deeper? 💜", body: "Premium sessions can help you unlock breakthrough moments." }
    ],
    returnJourney: [
      { title: "You started something important", body: "Let's continue your journey today. You're making progress." },
      { title: "Your growth matters 💪", body: "You've come this far. Keep going - we're here for you." }
    ],
    valueUpsell: [
      { title: "Did you know? 📊", body: "Users who attend weekly sessions feel 40% better within a month." },
      { title: "The power of consistency ✨", body: "Regular sessions create lasting change. Ready for your next step?" }
    ]
  },

  // 🎮 Fun & Addictive Notifications
  gamification: {
    streak: [
      { title: "🔥 3-day streak!", body: "You're on fire! Keep your momentum going." },
      { title: "Consistency champion 🏆", body: "You've checked in 5 days in a row. That's dedication!" },
      { title: "Streak alert! 🔥", body: "Don't break your streak - check in today!" }
    ],
    challenge: [
      { title: "Today's challenge 😊", body: "Take 3 deep breaths and smile. You've got this!" },
      { title: "Mini-mission 🎯", body: "Write down one thing you're grateful for today." },
      { title: "Self-care challenge 💜", body: "Do one kind thing for yourself today. You deserve it." }
    ],
    badge: [
      { title: "🏅 Badge unlocked!", body: "You've earned: 'Consistency Builder' - Keep it up!" },
      { title: "Achievement! 🌟", body: "You've unlocked: 'Mindful Master' - 10 breathing sessions completed!" },
      { title: "New level! 🎮", body: "You've reached Level 2: Sprout. Your growth is showing!" }
    ],
    careDrop: [
      { title: "Here's something for you 💙", body: "Tap to open your daily care drop..." },
      { title: "A little gift 🎁", body: "You've been working hard. Here's a moment of calm..." },
      { title: "Surprise! ✨", body: "A special message just for you today..." }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get a random message from a notification category
 */
function getRandomMessage(category, subcategory) {
  const messages = NOTIFICATION_TEMPLATES[category]?.[subcategory] || [];
  if (messages.length === 0) return { title: "Check in", body: "How are you feeling today?" };
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Track user mood for intelligent notifications
 */
export function trackUserMood(userId, mood, intensity) {
  if (!userMoodHistory.has(userId)) {
    userMoodHistory.set(userId, []);
  }
  
  const history = userMoodHistory.get(userId);
  history.push({ mood, intensity, timestamp: new Date().toISOString() });
  
  // Keep only last 30 entries
  if (history.length > 30) {
    history.shift();
  }
  
  console.log(`[Push Notifications] Tracked mood for user ${userId}: ${mood} (${intensity}/10)`);
}

/**
 * Track user activity
 */
export function trackUserActivity(userId) {
  userLastActive.set(userId, new Date().toISOString());
}

/**
 * Analyze user mood patterns
 */
function analyzeUserMood(userId) {
  const history = userMoodHistory.get(userId) || [];
  if (history.length === 0) return { trend: 'neutral', recentMoods: [] };
  
  const recentMoods = history.slice(-7); // Last 7 entries
  const negativeCount = recentMoods.filter(h => ['Sad', 'Stressed', 'Angry', 'Anxious', 'Tired'].includes(h.mood)).length;
  const positiveCount = recentMoods.filter(h => ['Happy', 'Calm'].includes(h.mood)).length;
  
  let trend = 'neutral';
  if (negativeCount > positiveCount && negativeCount >= 3) trend = 'low';
  else if (positiveCount > negativeCount && positiveCount >= 2) trend = 'improving';
  
  return { trend, recentMoods, negativeCount, positiveCount };
}

/**
 * Check if user has been inactive
 */
function isUserInactive(userId, days = 3) {
  const lastActive = userLastActive.get(userId);
  if (!lastActive) return true;
  
  const daysDiff = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff >= days;
}

// ==================== NOTIFICATION SENDER ====================

/**
 * Send notification to all subscribers
 */
async function sendNotificationToAll(payload, filterFn = null) {
  const sendPromises = [];
  let sentCount = 0;
  let failedCount = 0;
  
  subscriptions.forEach((data, endpoint) => {
    // Apply filter if provided
    if (filterFn && !filterFn(data)) return;
    
    const promise = webpush.sendNotification(data.subscription, payload)
      .then(() => {
        sentCount++;
        data.lastNotified = new Date().toISOString();
      })
      .catch(err => {
        failedCount++;
        
        // Handle expired subscriptions (410 Gone)
        if (err.statusCode === 410) {
          console.log(`[Push Server] Subscription expired, removing: ${endpoint.substring(0, 50)}...`);
          subscriptions.delete(endpoint);
        } else {
          console.error(`[Push Server] Send failed for ${endpoint.substring(0, 50)}...:`, err.message);
        }
      });
    
    sendPromises.push(promise);
  });
  
  await Promise.all(sendPromises);
  
  return { sent: sentCount, failed: failedCount, total: subscriptions.size };
}

/**
 * Send emotionally intelligent notification based on user state
 */
async function sendEmotionalNotification(userId) {
  const analysis = analyzeUserMood(userId);
  let message;
  
  if (analysis.trend === 'low') {
    message = getRandomMessage('emotionalSupport', 'low');
  } else if (analysis.trend === 'improving') {
    message = getRandomMessage('emotionalSupport', 'improving');
  } else if (isUserInactive(userId, 3)) {
    message = getRandomMessage('emotionalSupport', 'silent');
  } else {
    // Late night check (after 10 PM)
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour < 6) {
      message = getRandomMessage('emotionalSupport', 'lateNight');
    } else {
      return; // No notification needed
    }
  }
  
  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    action: 'emotional-check',
    tag: `emotional_${Date.now()}`,
    id: `emotional_${Date.now()}`
  });
  
  await sendNotificationToAll(payload);
  console.log(`[Push Notifications] Emotional notification sent: ${message.title}`);
}

/**
 * Send revenue-driving notification (subtle)
 */
async function sendRevenueNotification(type, userData = {}) {
  let message;
  
  switch (type) {
    case 'therapistMatch':
      message = getRandomMessage('revenue', 'therapistMatch');
      break;
    case 'scarcity':
      message = getRandomMessage('revenue', 'scarcity');
      break;
    case 'firstPaid':
      message = getRandomMessage('revenue', 'firstPaid');
      break;
    case 'returnJourney':
      message = getRandomMessage('revenue', 'returnJourney');
      break;
    case 'valueUpsell':
      message = getRandomMessage('revenue', 'valueUpsell');
      break;
    default:
      message = { title: "Ready for your next step?", body: "We're here to support your journey." };
  }
  
  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    action: userData.action || 'therapist',
    actionUrl: userData.url || '/therapists',
    tag: `revenue_${type}_${Date.now()}`,
    id: `revenue_${Date.now()}`
  });
  
  await sendNotificationToAll(payload);
  console.log(`[Push Notifications] Revenue notification sent: ${type}`);
}

/**
 * Send gamification notification
 */
async function sendGamificationNotification(type, userData = {}) {
  let message;
  
  switch (type) {
    case 'streak':
      message = getRandomMessage('gamification', 'streak');
      break;
    case 'challenge':
      message = getRandomMessage('gamification', 'challenge');
      break;
    case 'badge':
      message = getRandomMessage('gamification', 'badge');
      break;
    case 'careDrop':
      message = getRandomMessage('gamification', 'careDrop');
      break;
    default:
      message = { title: "Keep going! 💪", body: "You're doing great. Check in today!" };
  }
  
  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    action: userData.action || 'dashboard',
    tag: `gamification_${type}_${Date.now()}`,
    id: `gamification_${Date.now()}`
  });
  
  await sendNotificationToAll(payload);
  console.log(`[Push Notifications] Gamification notification sent: ${type}`);
}

// ==================== API HANDLERS ====================

/**
 * Subscribe endpoint
 */
async function subscribeHandler(req, res) {
  try {
    const subscription = req.body;
    const preferences = subscription.preferences || DEFAULT_PREFERENCES;
    
    const key = subscription.endpoint;
    
    subscriptions.set(key, {
      subscription,
      preferences,
      createdAt: new Date().toISOString(),
      lastNotified: null
    });
    
    console.log(`[Push Server] New subscription registered: ${key.substring(0, 50)}...`);
    console.log(`[Push Server] Total subscriptions: ${subscriptions.size}`);
    
    res.status(201).json({ 
      message: 'Subscription received successfully',
      subscriptionCount: subscriptions.size
    });
  } catch (error) {
    console.error('[Push Server] Subscribe error:', error);
    res.status(500).json({ error: 'Failed to register subscription' });
  }
}

/**
 * Unsubscribe endpoint
 */
async function unsubscribeHandler(req, res) {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }
    
    const existed = subscriptions.delete(endpoint);
    
    if (existed) {
      console.log(`[Push Server] Subscription removed: ${endpoint.substring(0, 50)}...`);
    }
    
    res.json({ 
      message: 'Subscription removed',
      subscriptionCount: subscriptions.size
    });
  } catch (error) {
    console.error('[Push Server] Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
}

/**
 * Broadcast notification endpoint
 */
async function notifyHandler(req, res) {
  try {
    const { title, body, action, actionUrl, tag, requireInteraction } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    const payload = JSON.stringify({
      title,
      body,
      action,
      actionUrl,
      tag: tag || `notification_${Date.now()}`,
      requireInteraction: requireInteraction || false,
      id: Date.now().toString()
    });
    
    const result = await sendNotificationToAll(payload);
    
    console.log(`[Push Server] Broadcast sent: ${result.sent}/${result.total} delivered`);
    
    res.json({ 
      message: 'Notifications sent',
      ...result
    });
  } catch (error) {
    console.error('[Push Server] Notify error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
}

/**
 * Emotional notification endpoint
 */
async function emotionalNotifyHandler(req, res) {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    await sendEmotionalNotification(userId);
    
    res.json({ message: 'Emotional notification sent' });
  } catch (error) {
    console.error('[Push Server] Emotional notify error:', error);
    res.status(500).json({ error: 'Failed to send emotional notification' });
  }
}

/**
 * Revenue notification endpoint
 */
async function revenueNotifyHandler(req, res) {
  try {
    const { type, userData } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'type required' });
    }
    
    await sendRevenueNotification(type, userData);
    
    res.json({ message: 'Revenue notification sent' });
  } catch (error) {
    console.error('[Push Server] Revenue notify error:', error);
    res.status(500).json({ error: 'Failed to send revenue notification' });
  }
}

/**
 * Gamification notification endpoint
 */
async function gamificationNotifyHandler(req, res) {
  try {
    const { type, userData } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'type required' });
    }
    
    await sendGamificationNotification(type, userData);
    
    res.json({ message: 'Gamification notification sent' });
  } catch (error) {
    console.error('[Push Server] Gamification notify error:', error);
    res.status(500).json({ error: 'Failed to send gamification notification' });
  }
}

/**
 * Welcome notification endpoint for new users
 */
async function welcomeNotifyHandler(req, res) {
  try {
    const { userId, userName } = req.body;
    
    // Get a random welcome message
    const message = getRandomMessage('welcome');
    
    // Personalize the message if userName is provided
    const personalizedTitle = message.title;
    const personalizedBody = userName 
      ? `${message.body} Welcome, ${userName}! 🌱`
      : message.body;
    
    const payload = JSON.stringify({
      title: personalizedTitle,
      body: personalizedBody,
      action: 'welcome',
      tag: `welcome_${Date.now()}`,
      id: `welcome_${Date.now()}`,
      data: {
        userId,
        userName,
        notificationType: 'welcome'
      }
    });
    
    // Send to all subscribers (the new user should be subscribed if they granted permission)
    const result = await sendNotificationToAll(payload);
    
    console.log(`[Push Notifications] Welcome notification sent: ${personalizedTitle}`);
    console.log(`[Push Notifications] Delivered to ${result.sent}/${result.total} subscribers`);
    
    res.json({ 
      message: 'Welcome notification sent',
      ...result
    });
  } catch (error) {
    console.error('[Push Server] Welcome notify error:', error);
    res.status(500).json({ error: 'Failed to send welcome notification' });
  }
}

/**
 * Track mood endpoint
 */
async function trackMoodHandler(req, res) {
  try {
    const { userId, mood, intensity } = req.body;
    
    if (!userId || !mood) {
      return res.status(400).json({ error: 'userId and mood required' });
    }
    
    trackUserMood(userId, mood, intensity || 5);
    trackUserActivity(userId);
    
    res.json({ message: 'Mood tracked successfully' });
  } catch (error) {
    console.error('[Push Server] Track mood error:', error);
    res.status(500).json({ error: 'Failed to track mood' });
  }
}

/**
 * Get subscription stats
 */
function statsHandler(req, res) {
  const now = new Date();
  
  let activeCount = 0;
  let moodEnabled = 0;
  let journalEnabled = 0;
  let breatheEnabled = 0;
  
  subscriptions.forEach((data) => {
    activeCount++;
    if (data.preferences.moodReminder) moodEnabled++;
    if (data.preferences.journalReminder) journalEnabled++;
    if (data.preferences.breatheReminder) breatheEnabled++;
  });
  
  res.json({
    totalSubscriptions: subscriptions.size,
    activeSubscriptions: activeCount,
    preferences: {
      moodReminder: moodEnabled,
      journalReminder: journalEnabled,
      breatheReminder: breatheEnabled
    },
    queueLength: notificationQueue.length,
    timestamp: now.toISOString()
  });
}

/**
 * Health check endpoint
 */
function healthHandler(req, res) {
  res.json({
    status: 'healthy',
    service: 'push-notifications',
    uptime: process.uptime(),
    subscriptions: subscriptions.size,
    vapidConfigured: !!publicVapidKey && !!privateVapidKey,
    timestamp: new Date().toISOString()
  });
}

// ==================== SCHEDULED NOTIFICATIONS ====================

/**
 * Daily mood reminder (9:00 AM UTC)
 */
cron.schedule('0 9 * * *', async () => {
  console.log('[Push Server] Running daily mood reminder (9:00 AM)');
  
  const payload = JSON.stringify({
    title: '🌟 Time to Check In',
    body: 'How are you feeling right now? Take a moment to log your mood.',
    action: 'log-mood',
    tag: 'daily-mood-reminder',
    id: `mood_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload, (data) => 
    data.preferences.moodReminder
  );
  
  console.log(`[Push Server] Mood reminder: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

/**
 * Daily journal reminder (8:00 PM UTC)
 */
cron.schedule('0 20 * * *', async () => {
  console.log('[Push Server] Running daily journal reminder (8:00 PM)');
  
  const payload = JSON.stringify({
    title: '📝 Journal Time',
    body: 'Reflect on your day. What thoughts and feelings would you like to explore?',
    action: 'journal',
    tag: 'daily-journal-reminder',
    id: `journal_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload, (data) => 
    data.preferences.journalReminder
  );
  
  console.log(`[Push Server] Journal reminder: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

/**
 * Daily breathe reminder (12:00 PM UTC)
 */
cron.schedule('0 12 * * *', async () => {
  console.log('[Push Server] Running daily breathe reminder (12:00 PM)');
  
  const payload = JSON.stringify({
    title: '🧘 Breathe & Center',
    body: 'Take a moment to breathe deeply and center yourself.',
    action: 'breathe',
    tag: 'daily-breathe-reminder',
    id: `breathe_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload, (data) => 
    data.preferences.breatheReminder
  );
  
  console.log(`[Push Server] Breathe reminder: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

/**
 * Daily gratitude reminder (6:00 PM UTC)
 */
cron.schedule('0 18 * * *', async () => {
  console.log('[Push Server] Running daily gratitude reminder (6:00 PM)');
  
  const payload = JSON.stringify({
    title: '🙏 Gratitude Moment',
    body: 'What are you grateful for today? Add a gratitude entry.',
    action: 'gratitude',
    tag: 'daily-gratitude-reminder',
    id: `gratitude_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload, (data) => 
    data.preferences.gratitudeReminder
  );
  
  console.log(`[Push Server] Gratitude reminder: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

/**
 * Weekly check-in (Monday 10 AM UTC)
 */
cron.schedule('0 10 * * 1', async () => {
  console.log('[Push Server] Running weekly check-in (Monday 10:00 AM)');
  
  const payload = JSON.stringify({
    title: '💜 Weekly Check-in',
    body: 'How has your week been? Take a moment to reflect on your wellness journey.',
    action: 'dashboard',
    tag: 'weekly-checkin',
    id: `weekly_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload);
  
  console.log(`[Push Server] Weekly check-in: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

/**
 * Daily challenge (11:00 AM UTC) - Gamification
 */
cron.schedule('0 11 * * *', async () => {
  console.log('[Push Server] Running daily challenge (11:00 AM)');
  
  await sendGamificationNotification('challenge', { action: 'challenge' });
}, { timezone: 'UTC' });

/**
 * Care drop (3:00 PM UTC) - Surprise notifications
 */
cron.schedule('0 15 * * *', async () => {
  console.log('[Push Server] Running care drop (3:00 PM)');
  
  await sendGamificationNotification('careDrop', { action: 'care-drop' });
}, { timezone: 'UTC' });

/**
 * Emotional check-in (7:00 PM UTC) - Analyze mood and send appropriate message
 */
cron.schedule('0 19 * * *', async () => {
  console.log('[Push Server] Running emotional check-in (7:00 PM)');
  
  // This would analyze user moods and send personalized messages
  // For now, send a general supportive message
  const payload = JSON.stringify({
    title: "How's your heart feeling? 💙",
    body: "You don't have to go through this alone. We're here for you.",
    action: 'emotional-check',
    tag: 'emotional-evening',
    id: `emotional_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload, (data) => 
    data.preferences.progressUpdates
  );
  
  console.log(`[Push Server] Emotional check-in: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

/**
 * Late night support (10:30 PM UTC)
 */
cron.schedule('30 22 * * *', async () => {
  console.log('[Push Server] Running late night support (10:30 PM)');
  
  const payload = JSON.stringify({
    title: "Can't sleep? 🌙",
    body: "Let's slow things down together. Try a breathing exercise.",
    action: 'breathe',
    tag: 'late-night-support',
    id: `latenight_${Date.now()}`
  });
  
  const result = await sendNotificationToAll(payload, (data) => 
    data.preferences.breatheReminder
  );
  
  console.log(`[Push Server] Late night support: ${result.sent}/${result.total} delivered`);
}, { timezone: 'UTC' });

// ==================== SETUP FUNCTION ====================

/**
 * Setup push notification routes on an existing Express app
 */
export function setupPushNotifications(app) {
  // Global middlewares like cors and bodyParser should be handled in server.js
  // Registration of individual push notification routes below...

  // Mount all push notification routes
  app.post('/api/subscribe', subscribeHandler);
  app.post('/api/unsubscribe', unsubscribeHandler);
  app.post('/api/notify', notifyHandler);
  app.post('/api/notify/emotional', emotionalNotifyHandler);
  app.post('/api/notify/revenue', revenueNotifyHandler);
  app.post('/api/notify/gamification', gamificationNotifyHandler);
  app.post('/api/notify/welcome', welcomeNotifyHandler);
  app.post('/api/notify/intelligent', intelligentNotifyHandler);
  app.post('/api/track/mood', trackMoodHandler);
  app.get('/api/push/stats', statsHandler);
  app.get('/api/push/health', healthHandler);

  console.log('[Push Notifications] Routes mounted on main server');
  console.log('[Push Notifications] VAPID configured:', !!publicVapidKey && !!privateVapidKey);
  console.log('[Push Notifications] Health check: /api/push/health');
  console.log('[Push Notifications] Stats: /api/push/stats');
  console.log('[Push Notifications] Emotional notifications: /api/notify/emotional');
  console.log('[Push Notifications] Revenue notifications: /api/notify/revenue');
  console.log('[Push Notifications] Gamification notifications: /api/notify/gamification');
  console.log('[Push Notifications] Welcome notifications: /api/notify/welcome');
  console.log('[Push Notifications] Mood tracking: /api/track/mood');

  // Return control objects for external access
  return {
    subscriptions,
    sendNotificationToAll,
    sendEmotionalNotification,
    sendRevenueNotification,
    sendGamificationNotification,
    trackUserMood,
    trackUserActivity,
    getVapidPublicKey: () => publicVapidKey
  };
}

// Export for use in main server
export { subscriptions, sendNotificationToAll };
export default { 
  setupPushNotifications, 
  subscriptions, 
  sendNotificationToAll,
  sendEmotionalNotification,
  sendRevenueNotification,
  sendGamificationNotification,
  trackUserMood,
  trackUserActivity,
  getVapidPublicKey: () => publicVapidKey 
};