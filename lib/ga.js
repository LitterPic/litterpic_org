/**
 * Google Analytics 4 helper utilities.
 * All functions are safe to call server-side — they no-op when `window.gtag`
 * is not available (SSR / gtag not yet loaded).
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Fire any GA4 event with optional parameters. */
export function trackEvent(eventName, params = {}) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
}

/**
 * Associate the current session with a Firebase Auth user ID.
 * Call this after a confirmed sign-in so cross-device journeys are stitched.
 */
export function setGAUserId(uid) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('config', GA_MEASUREMENT_ID, { user_id: uid });
}

/** Clear the user ID on sign-out. */
export function clearGAUserId() {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('config', GA_MEASUREMENT_ID, { user_id: undefined });
}

// ─── Named conversion events ──────────────────────────────────────────────────

/** Fired when a new account is successfully created. */
export function trackSignUp(method = 'email') {
    trackEvent('sign_up', { method });
}

/** Fired when a user successfully logs in. */
export function trackLogin(method = 'email') {
    trackEvent('login', { method });
}

/**
 * Fired when a litter post is successfully created.
 * @param {number} litterWeight  Weight in pounds.
 * @param {string} location      Location string.
 */
export function trackPostCreated(litterWeight, location = '') {
    trackEvent('post_created', {
        litter_weight_lbs: litterWeight,
        location,
    });
}

/**
 * Fired when a user submits an event RSVP.
 * @param {string} eventId   Firestore event document ID.
 * @param {string} eventTitle
 */
export function trackRsvpSubmitted(eventId, eventTitle = '') {
    trackEvent('rsvp_submitted', { event_id: eventId, event_title: eventTitle });
}

/** Fired when the contact form is submitted successfully. */
export function trackContactFormSubmitted() {
    trackEvent('contact_form_submitted');
}

/**
 * Fired when a user clicks an app-store download link.
 * @param {'ios'|'android'} platform
 */
export function trackAppStoreClick(platform) {
    trackEvent('app_store_click', { platform });
}

/** Fired when a user clicks the Donate button/link. */
export function trackDonateClick(source = '') {
    trackEvent('donate_click', { source });
}

