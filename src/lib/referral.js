/**
 * Referral attribution on the client.
 *
 * A partner posts a link like `https://amccatalyst.com/?ref=WINGX`. The code can
 * land on any page, and the visitor might not sign up until days later, so it is
 * stashed in localStorage the moment it is seen and read back at registration.
 */

const KEY = 'amc_referral_code';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Reads `?ref=` from a search string and stores it if present. */
export const captureReferralFromSearch = (search) => {
  try {
    const raw = new URLSearchParams(search).get('ref');
    if (!raw) return;
    const code = raw.trim().toUpperCase().replace(/\s+/g, '').slice(0, 32);
    if (!code) return;
    localStorage.setItem(KEY, JSON.stringify({ code, ts: Date.now() }));
  } catch {
    /* private mode / storage disabled — attribution just won't persist */
  }
};

/** The stored code, or null if none / expired. */
export const getStoredReferralCode = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!parsed?.code) return null;
    if (Date.now() - (parsed.ts ?? 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
};

export const clearStoredReferralCode = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
