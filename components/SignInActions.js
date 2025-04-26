import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-toastify';

export default function SignInActions({
    email,
    password,
    isMigratedUser,
    userId,
    showMigratedUserError,
    setShowMigratedUserError,
    router,
}) {
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                toast.error('Please verify your email before logging in.');
                return;
            }

            if (router.query.redirectTo) {
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
