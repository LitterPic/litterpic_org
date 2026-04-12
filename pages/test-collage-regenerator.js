import React, { useState, useEffect } from 'react';
import withAuth from '../components/withAuth';
import { useAuth } from '../lib/firebase';
import { regenerateCollagesToLastPosts, getCollagesSummary } from '../utils/collageRegenerator';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Only allow this specific email to access the page
const AUTHORIZED_EMAIL = 'alek@litterpic.org';

function TestCollageRegenerator() {
    const { user } = useAuth();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(null);
    const [results, setResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [postsToProcess, setPostsToProcess] = useState(3);

    // Check authorization
    const isAuthorized = user?.email === AUTHORIZED_EMAIL;

    useEffect(() => {
        // Load initial summary only if authorized
        if (user?.uid && isAuthorized) {
            loadSummary();
        }
    }, [user?.uid, isAuthorized]);

    const loadSummary = async () => {
        try {
            const data = await getCollagesSummary(user.uid);
            setSummary(data);
        } catch (error) {
            console.error('Error loading summary:', error);
            toast.error('Failed to load collage summary');
        }
    };

    const handleRegenerateCollages = async () => {
        if (!user?.uid) {
            toast.error('User not authenticated');
            return;
        }

        setIsRunning(true);
        setProgress(null);
        setResults(null);

        try {
            toast.info(`Starting collage regeneration for last ${postsToProcess} posts...`);

            const result = await regenerateCollagesToLastPosts(
                user.uid,
                postsToProcess,
                (progressUpdate) => {
                    setProgress(progressUpdate);
                }
            );

            setResults(result);

            // Show success/warning message
            if (result.errors === 0) {
                toast.success(`✓ Successfully regenerated ${result.regenerated} collages!`);
            } else if (result.regenerated > 0) {
                toast.warning(`⚠ Regenerated ${result.regenerated} collages, but ${result.errors} errors occurred`);
            } else {
                toast.info(`All posts were skipped (${result.skipped}) or had errors (${result.errors})`);
            }

            // Reload summary
            await loadSummary();

        } catch (error) {
            console.error('Error regenerating collages:', error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <ToastContainer />

            {/* Authorization Check */}
            {!isAuthorized && (
                <div style={{
                    backgroundColor: '#fee',
                    border: '2px solid #f44',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <h2>❌ Access Denied</h2>
                    <p>This page is not available to your account.</p>
                </div>
            )}

            {isAuthorized && (
                <>
                    <h1>🧪 Test Collage Regenerator</h1>
                    <p>This page lets you test the collage regeneration on your last N posts.</p>

            {/* Summary Section */}
            {summary && (
                <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h2>Current Summary</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <strong>Total Posts:</strong> {summary.totalPosts}
                        </div>
                        <div>
                            <strong>Posts with Collage:</strong> {summary.postsWithCollage} ✓
                        </div>
                        <div>
                            <strong>Posts without Collage:</strong> {summary.postsWithoutCollage}
                        </div>
                        <div>
                            <strong>Total Photos:</strong> {summary.totalPhotos}
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ddd'
            }}>
                <h2>Regeneration Controls</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label>
                        Number of posts to process:
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={postsToProcess}
                            onChange={(e) => setPostsToProcess(parseInt(e.target.value))}
                            disabled={isRunning}
                            style={{ marginLeft: '10px', width: '60px', padding: '5px' }}
                        />
                    </label>
                </div>

                <button
                    onClick={handleRegenerateCollages}
                    disabled={isRunning}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: isRunning ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isRunning ? 'Regenerating...' : '🚀 Regenerate Collages'}
                </button>
            </div>

            {/* Progress Section */}
            {progress && (
                <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #90caf9'
                }}>
                    <h3>Progress</h3>
                    <p>
                        <strong>Status:</strong> {progress.status}
                    </p>
                    <p>
                        <strong>Step:</strong> {progress.step} of {progress.total}
                    </p>
                    {progress.postIndex && (
                        <p>
                            <strong>Post Progress:</strong> {progress.postIndex} of {progress.totalPosts}
                        </p>
                    )}
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '10px',
                        borderRadius: '4px',
                        marginTop: '10px'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '20px',
                            backgroundColor: '#ddd',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(progress.step / progress.total) * 100}%`,
                                height: '100%',
                                backgroundColor: '#4caf50',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {results && (
                <div style={{
                    backgroundColor: '#f0f4f8',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #90caf9'
                }}>
                    <h2>Results</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <strong>Total Processed:</strong> {results.processed} of {results.total}
                        </div>
                        <div>
                            <strong>Regenerated:</strong> {results.regenerated} ✓
                        </div>
                        <div>
                            <strong>Skipped:</strong> {results.skipped}
                        </div>
                        <div>
                            <strong>Errors:</strong> {results.errors}
                        </div>
                    </div>

                    {results.details.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Detailed Results:</h3>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '14px'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#e0e0e0' }}>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #999' }}>Post ID</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #999' }}>Status</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #999' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.details.map((detail, index) => (
                                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                                <code style={{ fontSize: '12px' }}>{detail.postId}</code>
                                            </td>
                                            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                                {detail.status === 'REGENERATED' && <span>✓ {detail.status}</span>}
                                                {detail.status === 'SKIPPED' && <span>⊘ {detail.status}</span>}
                                                {detail.status === 'ERROR' && <span>✗ {detail.status}</span>}
                                            </td>
                                            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                                {detail.reason || detail.photoCount || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Info Section */}
            <div style={{
                backgroundColor: '#f9f9f9',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <h3>ℹ️ How This Works</h3>
                <ul>
                    <li>Fetches your last N posts</li>
                    <li>Checks if each post already has a collage (AUTO_COLLAGE_ prefix)</li>
                    <li>For posts without collages, downloads the images</li>
                    <li>Generates a new 2x2 collage from the first 4 images</li>
                    <li>Uploads the collage with AUTO_COLLAGE_ prefix</li>
                    <li>Updates the post with the new collage as the first photo</li>
                    <li>Later, you can schedule this to run on Cloud Functions</li>
                </ul>
            </div>
            </>
            )}
        </div>
    );
}

export default withAuth(TestCollageRegenerator);





