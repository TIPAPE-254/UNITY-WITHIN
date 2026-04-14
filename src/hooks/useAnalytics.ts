import ReactGA from 'react-ga4';

/**
 * Custom hook for tracking events with Google Analytics
 * Use this throughout your app to track user interactions
 */
export function useAnalytics() {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const isEnabled = gaId && gaId !== 'G-XXXXXXXXXX';

  const trackEvent = (
    eventName: string,
    eventData?: Record<string, string | number | boolean>
  ) => {
    if (isEnabled) {
      try {
        ReactGA.event({
          category: 'engagement',
          action: eventName,
          ...eventData,
        } as any);
        console.log(`[Analytics Event] ${eventName}:`, eventData);
      } catch (error) {
        console.error('Analytics error:', error);
      }
    }
  };

  return { trackEvent, isEnabled };
}
