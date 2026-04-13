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
      ReactGA.event({
        action: eventName,
        ...eventData,
      });
      console.log(`[Analytics Event] ${eventName}:`, eventData);
    }
  };

  return { trackEvent, isEnabled };
}
