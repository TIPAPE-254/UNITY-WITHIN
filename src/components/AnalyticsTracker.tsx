import React, { useEffect } from 'react';
import { ViewState } from '../types';

interface AnalyticsTrackerProps {
  currentView: ViewState;
}

export const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ currentView }) => {
  useEffect(() => {
    // Track page view in analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: `/${currentView}`,
        page_title: currentView
      });
    }
  }, [currentView]);

  return null; // This component only handles tracking, doesn't render anything
};

declare global {
  interface Window {
    gtag?: (command: string, action: string, data: unknown) => void;
  }
}
