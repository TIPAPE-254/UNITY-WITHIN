import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { ViewState } from '../types';

interface AnalyticsTrackerProps {
  currentView: ViewState;
}

/**
 * Tracks page views and user interactions with Google Analytics
 * Monitors view changes and sends them to GA4
 */
export function AnalyticsTracker({ currentView }: AnalyticsTrackerProps) {
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    // Only track if GA is properly initialized
    if (gaId && gaId !== 'G-XXXXXXXXXX') {
      // Map internal view names to readable page paths
      const pageMap: Record<ViewState, string> = {
        landing: '/landing',
        login: '/login',
        signup: '/signup',
        dashboard: '/dashboard',
        wellness: '/wellness-toolkit',
        chat: '/ai-chat',
        journal: '/journal',
        breathe: '/breathe',
        education: '/education',
      };

      const pagePath = pageMap[currentView] || `/${currentView}`;
      const pageTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);

      // Send page view event to GA
      ReactGA.send({
        hitType: 'pageview',
        page: pagePath,
        title: pageTitle,
      });

      console.log(`[Analytics] Tracked page view: ${pagePath}`);
    }
  }, [currentView]);

  // This component doesn't render anything
  return null;
}
