/**
 * Firebase Auth Injection Helper
 *
 * Playwright's storageState() does NOT capture Firebase's IndexedDB auth tokens.
 * This helper authenticates by:
 *  1. Calling the Firebase Auth REST API to obtain real tokens (Node-side, no browser needed)
 *  2. Navigating to the app's home page (same origin → same IndexedDB namespace)
 *  3. Using page.evaluate() to write auth tokens into IndexedDB and AWAITING the write
 *
 * After calling injectFirebaseAuth(page), the caller can navigate to any protected route
 * and Firebase will find the persisted session in IndexedDB.
 *
 * Usage:
 *   const { injectFirebaseAuth } = require('../helpers/auth');
 *   test.beforeEach(async ({ page }) => {
 *     await injectFirebaseAuth(page);
 *     await page.goto('/notifications');
 *   });
 */

const FIREBASE_API_KEY = 'AIzaSyA-s9rMh2K9dDqJAERWj6EyQ4Qj3hlIRHg';
const FIREBASE_APP_NAME = '[DEFAULT]';

/** Call Firebase Auth REST API from Node to get real tokens */
async function getFirebaseTokens(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    if (!res.ok) {
        throw new Error(`Firebase REST auth failed (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();

    // Decode JWT payload to get the real emailVerified claim
    const [, payloadB64] = data.idToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

    return {
        uid: data.localId,
        email: data.email,
        displayName: data.displayName || '',
        photoURL: data.photoUrl || null,
        emailVerified: payload.email_verified === true,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expirationTime: Date.now() + (parseInt(data.expiresIn || '3600', 10) * 1000),
    };
}

/**
 * Inject Firebase auth into a Playwright page.
 *
 * Steps:
 *  1. Navigates to '/' (same origin = same IndexedDB)
 *  2. Waits for the page to load
 *  3. Writes auth tokens to IndexedDB via page.evaluate() (fully awaited)
 *
 * After this function returns, any subsequent page.goto('/protected-route')
 * will find the Firebase auth tokens already in IndexedDB.
 *
 * @param {import('@playwright/test').Page} page
 */
async function injectFirebaseAuth(page) {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    const tokens = await getFirebaseTokens(email, password);

    // Navigate to home page first so we're on the correct origin for IndexedDB writes
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Write auth tokens to IndexedDB — page.evaluate awaits the full async write
    await page.evaluate(async ({ tokens, apiKey, appName }) => {
        const DB_NAME = 'firebaseLocalStorageDb';
        const STORE_NAME = 'firebaseLocalStorage';
        const AUTH_KEY = `firebase:authUser:${apiKey}:${appName}`;

        const authValue = {
            uid: tokens.uid,
            email: tokens.email,
            emailVerified: tokens.emailVerified,
            displayName: tokens.displayName,
            isAnonymous: false,
            photoURL: tokens.photoURL,
            providerData: [
                {
                    providerId: 'password',
                    uid: tokens.email,
                    displayName: tokens.displayName,
                    email: tokens.email,
                    phoneNumber: null,
                    photoURL: tokens.photoURL,
                },
            ],
            stsTokenManager: {
                refreshToken: tokens.refreshToken,
                accessToken: tokens.idToken,
                expirationTime: tokens.expirationTime,
            },
            createdAt: String(Date.now()),
            lastLoginAt: String(Date.now()),
            apiKey: apiKey,
            appName: appName,
        };

        // Fully await the IndexedDB write before returning
        await new Promise((resolve, reject) => {
            const openReq = indexedDB.open(DB_NAME, 1);

            openReq.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
                }
            };

            openReq.onsuccess = (e) => {
                const db = e.target.result;

                // If the store doesn't exist yet, we need to bump the version
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const newVersion = db.version + 1;
                    db.close();
                    const upgradeReq = indexedDB.open(DB_NAME, newVersion);
                    upgradeReq.onupgradeneeded = (ue) => {
                        ue.target.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
                    };
                    upgradeReq.onsuccess = (ue) => {
                        const db2 = ue.target.result;
                        const tx = db2.transaction(STORE_NAME, 'readwrite');
                        tx.objectStore(STORE_NAME).put({ fbase_key: AUTH_KEY, value: authValue });
                        tx.oncomplete = resolve;
                        tx.onerror = (err) => reject(err.target.error);
                    };
                    upgradeReq.onerror = (err) => reject(err.target.error);
                    return;
                }

                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put({ fbase_key: AUTH_KEY, value: authValue });
                tx.oncomplete = resolve;
                tx.onerror = (err) => reject(err.target.error);
            };

            openReq.onerror = (err) => reject(err.target.error);
        });
    }, { tokens, apiKey: FIREBASE_API_KEY, appName: FIREBASE_APP_NAME });
}

module.exports = { injectFirebaseAuth, getFirebaseTokens };
