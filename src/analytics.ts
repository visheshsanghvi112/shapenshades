import { logEvent } from 'firebase/analytics';
import { getAnalyticsInstance } from './firebase';
import { COOKIE_CONSENT_KEY } from '../components/CookieConsent';

/**
 * Check if user has consented to analytics
 */
const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return false;
    const consent = JSON.parse(stored);
    return consent.analytics === true;
  } catch {
    return false;
  }
};

/**
 * Track a page view event
 */
export const trackPageView = (pageName: string) => {
  if (!hasAnalyticsConsent()) return;
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_name: pageName,
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track page view', err);
  }
};

/**
 * Track a project view
 */
export const trackProjectView = (projectId: string, projectTitle: string) => {
  if (!hasAnalyticsConsent()) return;
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, 'view_item', {
      items: [
        {
          item_id: projectId,
          item_name: projectTitle,
          item_category: 'project',
        },
      ],
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track project view', err);
  }
};

/**
 * Track admin action
 */
export const trackAdminAction = (action: string, details?: Record<string, unknown>) => {
  if (!hasAnalyticsConsent()) return;
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, `admin_${action}`, {
      timestamp: new Date().toISOString(),
      ...details,
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track admin action', err);
  }
};

/**
 * Track contact form submission
 */
export const trackContactSubmission = (email: string) => {
  if (!hasAnalyticsConsent()) return;
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, 'generate_lead', {
      value: 1,
      currency: 'USD',
      email_provided: !!email,
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track contact submission', err);
  }
};

/**
 * Track offer form submission
 */
export const trackOfferSubmission = (email: string) => {
  if (!hasAnalyticsConsent()) return;
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, 'sign_up', {
      method: 'email',
      email_provided: !!email,
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track offer submission', err);
  }
};
