/**
 * Analytics tracking interface for Zukas Kitchen Spin & Win campaign.
 * 
 * Functions here act as placeholder boundaries so Google Analytics, Mixpanel,
 * Meta Pixel, or custom backend event tracking can be wired easily without modifying component logic.
 */

export const trackEvent = (eventName, payload = {}) => {
  // Safe logging in development mode; easily hooks into window.gtag or custom analytics
  if (import.meta.env.DEV) {
    console.log(`[Analytics Track] ${eventName}:`, payload);
  }

  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, payload);
    }
  } catch (e) {
    // Ignore analytics errors gracefully
  }
};
