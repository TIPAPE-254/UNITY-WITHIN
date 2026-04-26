// SYSTEM: UNITY WITHIN NOTIFICATION ENGINE v1
// Purpose: Human-like push notifications using rules, templates, and user context. NO AI/LLM. NO external APIs.

const TEMPLATES = {
  greeting: [
    "Good morning {name} ☀️ Ready to make impact today?",
    "Morning {name} 🌱 A new chance to do good.",
    "Rise and shine {name}! Today is yours to shape.",
    "Hello {name}, sending you good vibes this morning! 💗"
  ],
  reminder: [
    "Don’t forget your kindness quest today 🌿",
    "A small action today creates big change 🌍",
    "Your journey continues—one gentle step at a time.",
    "Pause and check in with yourself today, {name}."
  ],
  streak: [
    "{name}, your {streakDays}-day streak is growing 🔥",
    "Keep it going {name} 🌱 You’re on a roll!",
    "Amazing! {streakDays} days of self-care. Keep shining! 💖",
    "Consistency is powerful, {name}. {streakDays} days strong!"
  ],
  engagement: [
    "New campaign nearby ❤️ {campaignName} needs support",
    "Opportunity near you 🌍 Join {campaignName}",
    "{campaignName} is happening close by—your help matters!",
    "Make a difference in {campaignName} today, {name}."
  ],
  reengagement: [
    "We miss you {name} ❤️ Your journey is waiting",
    "Come back and continue making impact 🌱",
    "Your safe space is always here for you, {name}.",
    "It’s okay to take breaks. We’re here when you’re ready."
  ],
  mental_health: [
    "Take a deep breath 🌿 You’re doing enough",
    "Rest matters too 💧 Be kind to yourself",
    "You’re not alone. Reach out if you need support 💗",
    "Gentle reminder: progress isn’t always linear. Be kind to you."
  ],
  holiday: [
    "Happy Holiday 🎉 Spread kindness today",
    "Season of giving 🎄 Share love with others",
    "Wishing you warmth and joy this holiday, {name}!",
    "Celebrate today with love and gratitude."
  ],
  system: [
    "Your impact matters 🌍 Keep going"
  ]
};

let lastTemplate = {};

function pickTemplate(type, user) {
  const options = TEMPLATES[type];
  if (!options) return null;
  // Avoid repeating the same template twice in a row
  let idx = Math.floor(Math.random() * options.length);
  if (lastTemplate[type] === idx && options.length > 1) {
    idx = (idx + 1) % options.length;
  }
  lastTemplate[type] = idx;
  return options[idx];
}

function personalize(template, user, event) {
  let result = template;
  result = result.replace('{name}', user.name || '');
  result = result.replace('{streakDays}', user.streakDays ? user.streakDays : '');
  result = result.replace('{campaignName}', event.campaignName || '');
  // Remove double spaces and trailing punctuation if value missing
  return result.replace(/ +/g, ' ').replace(/ ([,!?])/, '$1').trim();
}

function shouldSendNotification(user, event) {
  if (event.isHoliday) return 'holiday';
  if (user.notificationsSentToday >= 3) return null;
  if (user.lastActiveHoursAgo > 48) return 'reengagement';
  if (user.mood === 'low') return 'mental_health';
  if (user.streakDays >= 3 && event.type === 'streak') return 'streak';
  if (event.hasNearbyCampaign) return 'engagement';
  if (event.hour >= 6 && event.hour <= 11) return 'greeting';
  return 'reminder';
}

function generateNotification(input) {
  const { user, event } = input;
  const type = shouldSendNotification(user, event);
  if (!type) return null;
  // Enforce max 3 notifications/day
  if (user.notificationsSentToday >= 3) return null;
  const template = pickTemplate(type, user);
  if (!template) return null;
  let body = personalize(template, user, event);
  // Title is first 12 words, body is max 25 words
  let title = body.split(' ').slice(0, 12).join(' ');
  if (body.length > 25) body = body.split(' ').slice(0, 25).join(' ');

  // Theme selection for UI (soft colors)
  let theme = 'white';
  if (type === 'mental_health' || type === 'reengagement') theme = 'pink';
  if (type === 'system') theme = 'black';

  return {
    title,
    body,
    type,
    theme // For frontend to render with soft color (white, pink, black)
  };
}

module.exports = { generateNotification };
