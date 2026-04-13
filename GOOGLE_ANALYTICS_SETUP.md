# Google Analytics Setup Guide

## ✅ What's Been Done

I've successfully set up Google Analytics 4 (GA4) tracking for your Unity Within React app. Here's what was implemented:

### 1. **Installation**
- ✅ Installed `react-ga4` library via npm

### 2. **Configuration**
- ✅ Updated `.env` with `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` placeholder
- ✅ Updated `src/index.tsx` to initialize GA on app startup
- ✅ GA only initializes if a valid measurement ID is provided (not the placeholder)

### 3. **Page View Tracking**
- ✅ Created `src/components/AnalyticsTracker.tsx` - Automatically tracks all view changes
- ✅ Maps internal view names to readable page paths (e.g., `/dashboard`, `/ai-chat`, etc.)
- ✅ Added to your App component to monitor navigation

### 4. **Custom Event Tracking**
- ✅ Created `src/hooks/useAnalytics.ts` - Custom hook for tracking user interactions

---

## 🔧 How to Complete Setup

### Step 1: Get Your GA Measurement ID
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property or use existing one
3. In the left sidebar, go to **Admin** → **Data Streams**
4. Click on your Web stream
5. Copy your **Measurement ID** (looks like `G-XXXXXXXXXX`)

### Step 2: Update Your .env File
Replace the placeholder in your `.env` file:

```env
# Before:
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# After:
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXXXX  # Your actual ID
```

### Step 3: Restart Your Dev Server
```bash
npm run dev
```

---

## 📊 Usage Examples

### Automatic Tracking (Already Implemented)
Page views are automatically tracked when users navigate between sections:
- Landing page → `/landing`
- Login → `/login`
- Dashboard → `/dashboard`
- AI Chat → `/ai-chat`
- Journal → `/journal`
- etc.

### Manual Event Tracking
Track custom user interactions throughout your app:

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

export function LoginComponent() {
  const { trackEvent } = useAnalytics();

  const handleLogin = async (email: string) => {
    // Track login attempt
    trackEvent('user_login', {
      email_domain: email.split('@')[1],
    });

    // Your login logic...
  };

  return (
    <button onClick={() => handleLogin('user@example.com')}>
      Login
    </button>
  );
}
```

### Common Events to Track
```typescript
// Track button clicks
trackEvent('button_click', { button_name: 'submit_journal' });

// Track form submissions
trackEvent('form_submit', { form_type: 'wellness_assessment' });

// Track feature usage
trackEvent('feature_access', { feature_name: 'meditation_timer' });

// Track user interactions
trackEvent('content_engagement', { 
  content_type: 'article',
  content_title: 'Understanding Your Emotions'
});

// Track error events
trackEvent('error_occurred', { 
  error_type: 'api_failure',
  endpoint: '/api/journal'
});
```

---

## 📈 What Gets Tracked

### Automatic Tracking:
- ✅ Every page/view the user visits
- ✅ Time spent on each page
- ✅ User device and browser info
- ✅ Geographic location
- ✅ Traffic source

### With Custom Events (using `useAnalytics()`):
- ✅ Button clicks
- ✅ Form submissions
- ✅ Feature usage
- ✅ User engagement metrics
- ✅ Errors and issues

---

## 🧪 Testing

1. Open your app: `npm run dev`
2. Open **Developer Tools** (F12)
3. Open **Console** tab
4. Look for logs like: `[Analytics] Tracked page view: /dashboard`
5. Navigate between sections - you should see new logs for each page
6. Go to [Google Analytics Real Time Report](https://analytics.google.com) to see live tracking

---

## 📁 Files Modified/Created

```
src/
├── index.tsx (modified) - GA initialization
├── App.tsx (modified) - Added AnalyticsTracker component
├── components/
│   └── AnalyticsTracker.tsx (created) - Page view tracking
├── hooks/
│   └── useAnalytics.ts (created) - Custom event tracking hook
.env (modified) - Added GA measurement ID
```

---

## 🔗 Useful Links
- [Google Analytics Setup Guide](https://support.google.com/analytics/answer/9304153)
- [react-ga4 Documentation](https://github.com/react-ga/react-ga4)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)

---

## Next Steps

After updating your measurement ID:

1. **Test tracking** in the Real Time Report
2. **Add event tracking** to key user interactions (logins, form submissions, etc.)
3. **Set up goals/conversions** in Google Analytics to track important actions
4. **Create custom dashboards** to monitor user behavior patterns

Happy tracking! 🚀
