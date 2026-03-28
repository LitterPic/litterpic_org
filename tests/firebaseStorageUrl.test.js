import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before importing the module (server-side only, no NEXT_PUBLIC_ prefix)
process.env.FIREBASE_PROJECT_ID = 'litterpic-fa0bb';
process.env.FIREBASE_API_KEY = 'test-api-key';

// Mock global fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

const { resolvePhotoUrl, resolvePhotoUrls, fetchPostData, PROJECT_ID } = require('../utils/firebaseStorageUrl');

describe('resolvePhotoUrl', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns null for falsy input', async () => {
        expect(await resolvePhotoUrl(null)).toBeNull();
        expect(await resolvePhotoUrl('')).toBeNull();
        expect(await resolvePhotoUrl(undefined)).toBeNull();
    });

    it('returns HTTP URLs unchanged', async () => {
        const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=abc';
        expect(await resolvePhotoUrl(url)).toBe(url);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resolves a storage path with download token', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ downloadTokens: 'tok123' }),
        });

        const result = await resolvePhotoUrl('userPosts/abc/1.webp');
        const expectedBase = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent('userPosts/abc/1.webp')}`;

        expect(result).toBe(`${expectedBase}?alt=media&token=tok123`);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('resolves a storage path without download token', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({}),
        });

        const result = await resolvePhotoUrl('userPosts/abc/1.webp');
        const expectedBase = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent('userPosts/abc/1.webp')}`;

        expect(result).toBe(`${expectedBase}?alt=media`);
    });

    it('strips gs:// prefix before resolving', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ downloadTokens: 'tok456' }),
        });

        const result = await resolvePhotoUrl('gs://litterpic-fa0bb.appspot.com/userPosts/abc/1.webp');
        expect(result).toContain(encodeURIComponent('userPosts/abc/1.webp'));
        expect(result).toContain('token=tok456');
    });

    it('falls back to alt=media URL on fetch error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await resolvePhotoUrl('userPosts/abc/1.webp');
        expect(result).toContain('?alt=media');
        expect(console.error).toHaveBeenCalled();
    });

    it('picks the first token when multiple tokens exist', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ downloadTokens: 'first,second,third' }),
        });

        const result = await resolvePhotoUrl('userPosts/abc/1.webp');
        expect(result).toContain('token=first');
        expect(result).not.toContain('second');
    });
});

describe('resolvePhotoUrls', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('resolves multiple paths in parallel', async () => {
        const urls = [
            'https://example.com/photo1.jpg',
            'https://example.com/photo2.jpg',
        ];

        const result = await resolvePhotoUrls(urls);
        expect(result).toEqual(urls);
        // HTTP URLs should not trigger fetch
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('filters out null results from invalid entries', async () => {
        const result = await resolvePhotoUrls([null, '', 'https://example.com/photo.jpg']);
        expect(result).toEqual(['https://example.com/photo.jpg']);
    });

    it('handles empty array', async () => {
        const result = await resolvePhotoUrls([]);
        expect(result).toEqual([]);
    });
});

describe('fetchPostData', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns defaults when Firestore returns no fields', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ error: 'not found' }),
        });

        const result = await fetchPostData('nonexistent');
        expect(result.authorName).toBe('A Volunteer');
        expect(result.photoUrls).toEqual(['https://litterpic.org/images/litter_pic_logo.png']);
        expect(result.description).toBe('Check out this inspiring LitterPic story!');
        expect(result.location).toBe('');
    });

    it('returns defaults on network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network down'));

        const result = await fetchPostData('error-post');
        expect(result.authorName).toBe('A Volunteer');
        expect(result.description).toBe('Check out this inspiring LitterPic story!');
    });

    it('extracts description, location, author, and photos from valid post', async () => {
        // First call: Firestore post document
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                fields: {
                    postDescription: { stringValue: '<p>Cleaned up the <b>park</b>!</p>' },
                    location: { stringValue: 'Central Park, NY' },
                    postPhotos: {
                        arrayValue: {
                            values: [
                                { stringValue: 'https://example.com/photo1.jpg' },
                                { stringValue: 'https://example.com/photo2.jpg' },
                            ],
                        },
                    },
                    postUser: {
                        referenceValue: 'projects/litterpic-fa0bb/databases/(default)/documents/users/user123',
                    },
                },
            }),
        });

        // Second call: user document fetch
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                fields: {
                    display_name: { stringValue: 'Jane Doe' },
                },
            }),
        });

        const result = await fetchPostData('valid-post');

        expect(result.description).toBe('Cleaned up the park!');
        expect(result.location).toBe('Central Park, NY');
        expect(result.authorName).toBe('Jane Doe');
        expect(result.photoUrls).toEqual([
            'https://example.com/photo1.jpg',
            'https://example.com/photo2.jpg',
        ]);
    });

    it('strips HTML tags and truncates long descriptions', async () => {
        const longText = 'A'.repeat(600);
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                fields: {
                    postDescription: { stringValue: longText },
                },
            }),
        });

        const result = await fetchPostData('long-desc-post');

        expect(result.description.length).toBe(500);
        expect(result.description).toMatch(/\.\.\.$/);
    });

    it('uses default author when user fetch has no display_name', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                fields: {
                    postUser: {
                        referenceValue: 'projects/litterpic-fa0bb/databases/(default)/documents/users/user456',
                    },
                },
            }),
        });

        // User doc without display_name
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ fields: {} }),
        });

        const result = await fetchPostData('no-name-post');
        expect(result.authorName).toBe('A Volunteer');
    });

    it('uses default photos when post has no postPhotos field', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                fields: {
                    postDescription: { stringValue: 'No photos here' },
                },
            }),
        });

        const result = await fetchPostData('no-photos-post');
        expect(result.photoUrls).toEqual(['https://litterpic.org/images/litter_pic_logo.png']);
    });

    it('resolves storage paths in photos via parallel fetch', async () => {
        // Post document
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                fields: {
                    postPhotos: {
                        arrayValue: {
                            values: [
                                { stringValue: 'userPosts/post1/photo.webp' },
                            ],
                        },
                    },
                },
            }),
        });

        // Storage metadata fetch (for resolving the path)
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ downloadTokens: 'mytoken' }),
        });

        const result = await fetchPostData('storage-path-post');

        expect(result.photoUrls.length).toBe(1);
        expect(result.photoUrls[0]).toContain('alt=media');
        expect(result.photoUrls[0]).toContain('token=mytoken');
    });
});
