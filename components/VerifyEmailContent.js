import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '../lib/firebase';
import { sendEmailVerification, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VerifyEmailContent = () => {
    const [user, setUser] = useState(null);
    const [isResending, setIsResending] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showLoginForm, setShowLoginForm] = useState(false);
    const RESEND_COOLDOWN = 60; // 60 seconds cooldown

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser && !currentUser.emailVerified) {
                setUser(currentUser);
                await checkResendEligibility(currentUser.uid);
            } else if (currentUser && currentUser.emailVerified) {
                // User has verified their email, redirect to home
                toast.success('Email verified! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Countdown timer for resend cooldown
        if (timeRemaining > 0) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeRemaining === 0 && !canResend) {
            setCanResend(true);
        }
    }, [timeRemaining, canResend]);

    const checkResendEligibility = async (userId) => {
        try {
            const requestDocRef = doc(db, 'emailVerificationRequests', userId);
            const requestDoc = await getDoc(requestDocRef);

            if (requestDoc.exists()) {
                const data = requestDoc.data();
                const lastRequestTime = data.lastRequestTime?.toDate();

                if (lastRequestTime) {
                    const timeSinceLastRequest = Math.floor((Date.now() - lastRequestTime.getTime()) / 1000);
                    const remainingTime = RESEND_COOLDOWN - timeSinceLastRequest;

                    if (remainingTime > 0) {
                        setCanResend(false);
                        setTimeRemaining(remainingTime);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking resend eligibility:', error);
        }
    };

    const handleLoginAndResend = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter your email and password');
            return;
        }

        setIsResending(true);

        try {
            // Sign in the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user;

            if (loggedInUser.emailVerified) {
                toast.success('Your email is already verified! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            }

            // User will be set by onAuthStateChanged
            toast.info('Logged in successfully. You can now resend the verification email.');
            setShowLoginForm(false);

        } catch (error) {
            console.error('Error logging in:', error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                toast.error('Invalid email or password');
            } else if (error.code === 'auth/invalid-email') {
                toast.error('Invalid email address');
            } else {
                toast.error('Failed to login. Please try again.');
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleResendVerification = async () => {
        if (!user || !canResend || isResending) {
            return;
        }

        setIsResending(true);

        try {
            // Check rate limiting in Firestore
            const requestDocRef = doc(db, 'emailVerificationRequests', user.uid);
            const requestDoc = await getDoc(requestDocRef);

            if (requestDoc.exists()) {
                const data = requestDoc.data();
                const lastRequestTime = data.lastRequestTime?.toDate();

                if (lastRequestTime) {
                    const timeSinceLastRequest = Math.floor((Date.now() - lastRequestTime.getTime()) / 1000);

                    if (timeSinceLastRequest < RESEND_COOLDOWN) {
                        const remainingTime = RESEND_COOLDOWN - timeSinceLastRequest;
                        toast.error(`Please wait ${remainingTime} seconds before requesting another email.`);
                        setCanResend(false);
                        setTimeRemaining(remainingTime);
                        setIsResending(false);
                        return;
                    }
                }
            }

            // Send verification email
            await sendEmailVerification(user);

            // Update the request timestamp in Firestore
            await setDoc(requestDocRef, {
                userId: user.uid,
                email: user.email,
                lastRequestTime: serverTimestamp()
            }, { merge: true });

            toast.success('Verification email sent! Please check your inbox.');

            // Set cooldown
            setCanResend(false);
            setTimeRemaining(RESEND_COOLDOWN);

        } catch (error) {
            console.error('Error resending verification email:', error);

            if (error.code === 'auth/too-many-requests') {
                toast.error('Too many requests. Please try again later.');
            } else {
                toast.error('Failed to send verification email. Please try again.');
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="page">
            <div className="content">
                <h1 className="heading-text">Verify Your Email</h1>
                <p>
                    Thank you for signing up! An email verification link has been sent to your inbox.
                    Please check your email and click on the link to activate your account.
                </p>
                {user && (
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        Email sent to: <strong>{user.email}</strong>
                    </p>
                )}
                {!user && !showLoginForm && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '0.5rem', border: '1px solid #ffc107' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#856404', marginBottom: '0.75rem' }}>
                            <strong>Need to resend your verification email?</strong><br />
                            Your verification link may have expired. Login with your password to receive a new one.
                        </p>
                        <button
                            onClick={() => setShowLoginForm(true)}
                            className="ok-button"
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                            Login to Resend Email
                        </button>
                    </div>
                )}
                {!user && showLoginForm && (
                    <form onSubmit={handleLoginAndResend} style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem', border: '1px solid #dee2e6' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Login to Resend Verification Email</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ced4da', fontSize: '1rem' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Your password"
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ced4da', fontSize: '1rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="submit"
                                className="ok-button"
                                disabled={isResending}
                                style={{ opacity: isResending ? 0.6 : 1 }}
                            >
                                {isResending ? 'Logging in...' : 'Login'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLoginForm(false)}
                                className="ok-button"
                                style={{ backgroundColor: '#6c757d' }}
                            >
                                Cancel
                            </button>
                        </div>
                        <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.85rem', color: '#666' }}>
                            Forgot your password? <Link href="/login" style={{ color: '#0066cc' }}>Reset it here</Link>
                        </p>
                    </form>
                )}
                {user && (
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        Didn't receive the email? Check your spam folder or request a new one below.
                    </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    {user && (
                        <button
                            className="ok-button"
                            onClick={handleResendVerification}
                            disabled={!canResend || isResending}
                            style={{
                                opacity: (!canResend || isResending) ? 0.6 : 1,
                                cursor: (!canResend || isResending) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isResending ? 'Sending...' :
                             !canResend ? `Resend in ${timeRemaining}s` :
                             'Resend Verification Email'}
                        </button>
                    )}
                    <Link href={user ? "/stories" : "/login"}>
                        <button className="ok-button">{user ? 'Continue to Site' : 'Go to Login'}</button>
                    </Link>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VerifyEmailContent;
