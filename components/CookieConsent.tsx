import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { initAnalytics, db } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const COOKIE_CONSENT_KEY = 'shapes_shades_cookie_consent';

export interface CookieConsentStatus {
  analytics: boolean;
  timestamp: number;
}

const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState<CookieConsentStatus | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookieConsentStatus;
        setConsent(parsed);
        if (parsed.analytics) {
          initAnalytics();
        }
        setShow(false);
      } catch (err) {
        console.warn('[CookieConsent] Failed to parse stored consent', err);
        setShow(true);
      }
    } else {
      setShow(true);
    }
  }, []);

  const logConsentToFirestore = async (accepted: boolean) => {
    try {
      await addDoc(collection(db, 'cookieConsents'), {
        analytics: accepted,
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[CookieConsent] Firestore log failed', err);
    }
  };

  const handleAccept = () => {
    const status: CookieConsentStatus = { analytics: true, timestamp: Date.now() };
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(status));
    setConsent(status);
    initAnalytics();
    logConsentToFirestore(true);
    setShow(false);
  };

  const handleReject = () => {
    const status: CookieConsentStatus = { analytics: false, timestamp: Date.now() };
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(status));
    setConsent(status);
    logConsentToFirestore(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 text-white border-t border-gray-800 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 text-sm">
          <p className="font-medium mb-1">Analytics & Cookies</p>
          <p className="text-gray-300">
            We use analytics to understand how visitors use our site. No personal data is stored.{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Privacy Policy: We collect anonymous usage data via Firebase Analytics to improve your experience.');
              }}
              className="underline hover:text-gray-100"
            >
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-lg border border-gray-600 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => setShow(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
export { COOKIE_CONSENT_KEY };
