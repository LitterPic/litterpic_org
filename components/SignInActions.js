import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-toastify';
import { trackLogin, setGAUserId } from '../lib/ga';

export default function SignInActions({
    email,
    password,
    isMigratedUser,
    userId,
    showMigratedUserError,
    setShowMigratedUserError,
    honeypot,
    router,
}) {
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {	                toast.warning('Please verify your email before logging in. You can request a new verification email on the next page.', {
                    autoClose: 5000
                });
	                // Important: signing in succeeds even when email is not verified.
	                // If we just `return` here, the user remains authenticated and can perform actions.
	                // We keep them signed in so they can resend the verification email
	                await router.push('/verify_email');
	                return;
            }

            trackLogin();
            setGAUserId(user.uid);

            // Fetch the user doc to decide where to send the user
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.exists() ? userDoc.data() : {};

            if (userData.first_login === true) {
                // Brand-new user — send them to fill in their profile
                await router.push(`/edit-profile/${user.uid}`);
            } else if (userData.has_visited_profile !== true) {
                // Existing user who has never seen their profile on the web —
                // send them to the profile page once. The profile page will set
                // has_visited_profile = true so this only fires once.
                // The ?welcome=true flag tells the profile page to show the
                // "please update your profile" prompt.
                await router.push('/profile?welcome=true');
            } else if (router.query.redirectTo) {
                await router.push(router.query.redirectTo);
            } else {
                await router.push('/');
            }
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                toast.error('Invalid Username or Password');
            } else {
                toast.error('Unexpected Error');
            }
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        // Honeypot check - if filled, it's a bot
        if (honeypot) {
            console.log('Bot detected via honeypot on password reset');
            // Don't show error to bot, just silently fail but show success message
            toast.success('Password reset email sent');
            return;
        }

        if (!email) {
            toast.error('Please enter your email address first.');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Password reset email sent');

            if (isMigratedUser) {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, { isMigrated: false });
                setShowMigratedUserError(false);
            }
        } catch (error) {
            toast.error('Failed to send password reset email');
        }
    };

    return (
        <div>
            <a
                className="sign-in-forgot-password"
                href="#"
                onClick={handleForgotPassword}
                role="button"
                tabIndex="0"
            >
                Forgot Password?
            </a>
            <button
                className={`sign-in-button ${isMigratedUser ? 'disabled-button' : ''}`}
                type="submit"
                onClick={handleSubmit}
                disabled={isMigratedUser}
            >
                Login
            </button>
            {showMigratedUserError && (
                <div className="error-container">
                    <p className="error-message">
                        Your account has been migrated from LitterPic.com to LitterPic.org, please reset your password
                        using the
                        <a href="#" className="migrated-user-forgot-password" onClick={handleForgotPassword}>
                            Forgot Password
                        </a>
                        link.
                    </p>
                    <i
                        className="material-icons error-clear-icon"
                        onClick={() => setShowMigratedUserError(false)}
                    >
                        cancel
                    </i>
                </div>
            )}
        </div>
    );
}
