/**
 * A module-level flag that signals a signup is actively in progress.
 *
 * All onAuthStateChanged handlers that would call signOut() on unverified
 * users MUST check this flag first, so they don't race against the SignUpForm
 * writing the new user document to Firestore.
 *
 * Usage:
 *   import { setSignupInProgress, isSignupInProgress } from '../utils/signupInProgress';
 */

let _inProgress = false;

export function setSignupInProgress(value) {
    _inProgress = value;
}

export function isSignupInProgress() {
    return _inProgress;
}

