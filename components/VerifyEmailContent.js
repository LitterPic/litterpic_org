import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '../lib/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VerifyEmailContent = () => {
    const [user, setUser] = useState(null);
    const [isResending, setIsResending] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
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
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                    Didn't receive the email? Check your spam folder or request a new one below.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button
                        className="ok-button"
                        onClick={handleResendVerification}
                        disabled={!canResend || isResending || !user}
                        style={{
                            opacity: (!canResend || isResending || !user) ? 0.6 : 1,
                            cursor: (!canResend || isResending || !user) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isResending ? 'Sending...' :
                         !canResend ? `Resend in ${timeRemaining}s` :
                         'Resend Verification Email'}
                    </button>
                    <Link href="/stories">
                        <button className="ok-button">Continue to Site</button>
                    </Link>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VerifyEmailContent;
