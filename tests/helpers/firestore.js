/**
 * Firestore REST API cleanup helpers for E2E tests.
 *
 * Why REST API?
 *   Playwright runs in a browser context — we can't use firebase-admin (Node-only, service account).
 *   Instead we call the Firestore REST API from Node using the test user's ID token.
 *   The Firestore security rules have been updated to allow users to delete their own
 *   comments and RSVPs, so these requests are properly authorised.
 *
 * Usage:
 *   const { deleteTestComments, deleteTestRsvps } = require('../helpers/firestore');
 *   const { getFirebaseTokens } = require('../helpers/auth');
 *
 *   test.afterAll(async () => {
 *     const tokens = await getFirebaseTokens(email, password);
 *     await deleteTestComments(tokens.idToken, tokens.uid);
 *     await deleteTestRsvps(tokens.idToken, tokens.uid);
 *   });
 */

const PROJECT_ID = 'litterpic-fa0bb';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const QUERY_URL = `${FIRESTORE_BASE}:runQuery`;

// ─── Low-level REST helpers ────────────────────────────────────────────────

async function runStructuredQuery(idToken, structuredQuery) {
    const res = await fetch(QUERY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ structuredQuery }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore query failed (${res.status}): ${text}`);
    }

    return res.json(); // Array of { document: {...} } results
}

async function deleteDocument(idToken, docName) {
    // docName is the full resource path from the query result, e.g.:
    //   projects/litterpic-fa0bb/databases/(default)/documents/storyComments/abc123
    const res = await fetch(`https://firestore.googleapis.com/v1/${docName}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    return res.ok; // 200 or 204 both indicate success
}

async function getDocument(idToken, collection, docId) {
    const res = await fetch(`${FIRESTORE_BASE}/${collection}/${docId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!res.ok) return null;
    return res.json();
}

async function patchDocumentField(idToken, collection, docId, fieldPath, integerValue) {
    const url = `${FIRESTORE_BASE}/${collection}/${docId}?updateMask.fieldPaths=${encodeURIComponent(fieldPath)}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            fields: {
                [fieldPath]: { integerValue: String(integerValue) },
            },
        }),
    });

    return res.ok;
}

// ─── High-level cleanup helpers ────────────────────────────────────────────

/**
 * Delete all [TEST]-prefixed comments written by the test user.
 * Also decrements numComments on the associated post so the counter stays accurate.
 *
 * Requires the storyComments rule: allow delete if author == current user.
 *
 * @param {string} idToken - Firebase ID token for the test user
 * @param {string} userUid - UID of the test user
 * @returns {Promise<number>} number of comments deleted
 */
async function deleteTestComments(idToken, userUid) {
    const userRef = `projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`;

    const results = await runStructuredQuery(idToken, {
        from: [{ collectionId: 'storyComments' }],
        where: {
            fieldFilter: {
                field: { fieldPath: 'commentUser' },
                op: 'EQUAL',
                value: { referenceValue: userRef },
            },
        },
    });

    let deleted = 0;

    for (const result of results) {
        if (!result.document) continue;

        const commentText = result.document.fields?.comment?.stringValue || '';
        if (!commentText.startsWith('[TEST]')) continue; // only clean up test comments

        const postRef = result.document.fields?.postAssociation?.referenceValue;
        const ok = await deleteDocument(idToken, result.document.name);
        if (!ok) continue;

        deleted++;

        // Decrement numComments on the associated post
        if (postRef) {
            const postId = postRef.split('/').pop();
            const postDoc = await getDocument(idToken, 'userPosts', postId);
            if (postDoc) {
                const current = parseInt(postDoc.fields?.numComments?.integerValue || '0', 10);
                await patchDocumentField(idToken, 'userPosts', postId, 'numComments', Math.max(0, current - 1));
            }
        }
    }

    return deleted;
}

/**
 * Delete all RSVPs submitted by the test user (skips "Auto Owner RSVP" records
 * which are created automatically when a user creates their own event).
 *
 * Requires the rsvp rule: allow delete if user == current user.
 *
 * @param {string} idToken - Firebase ID token for the test user
 * @param {string} userUid - UID of the test user
 * @returns {Promise<number>} number of RSVPs deleted
 */
async function deleteTestRsvps(idToken, userUid) {
    const userRef = `projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`;

    const results = await runStructuredQuery(idToken, {
        from: [{ collectionId: 'rsvp' }],
        where: {
            fieldFilter: {
                field: { fieldPath: 'user' },
                op: 'EQUAL',
                value: { referenceValue: userRef },
            },
        },
    });

    let deleted = 0;

    for (const result of results) {
        if (!result.document) continue;

        // Skip organiser auto-RSVPs (created when the user creates an event for themselves)
        const note = result.document.fields?.noteToOrganizer?.stringValue || '';
        if (note === 'Auto Owner RSVP') continue;

        const ok = await deleteDocument(idToken, result.document.name);
        if (ok) deleted++;
    }

    return deleted;
}

/**
 * Fetch a single Firestore document via the REST API.
 * Returns the raw document object (fields, name, etc.) or null if not found.
 *
 * @param {string} idToken
 * @param {string} collection  e.g. 'userPosts'
 * @param {string} docId
 */
async function fetchDocument(idToken, collection, docId) {
    return getDocument(idToken, collection, docId);
}

module.exports = { deleteTestComments, deleteTestRsvps, fetchDocument };


