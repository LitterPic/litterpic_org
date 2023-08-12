import {useState} from 'react';
import {signInWithEmailAndPassword, sendPasswordResetEmail} from 'firebase/auth';
import {collection, doc, updateDoc, query, where, getDocs, getDoc} from 'firebase/firestore';
import {db, auth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEye, faEyeSlash, faTimes} from "@fortawesome/free-solid-svg-icons";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {debounce} from 'lodash';

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const [error, setError] = useState('');
    const [isMigratedUser, setIsMigratedUser] = useState(false);
    const [userId, setUserId] = useState(null);
    const [showMigratedUserError, setShowMigratedUserError] = useState(false);


    const clearError = () => {
        setError('');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const lastReset = user.metadata.lastPasswordReset;

            if (lastReset) {
                const recentReset = lastReset > Date.now() - PASSWORD_RESET_LIMIT;

                if (recentReset) {
                    await db.doc(`users/${user.uid}`).update({
                        isMigrated: false
                    });
                }
            }

            // Get the user's document from the users collection
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!user.emailVerified) {
                toast.error('Please verify your email before logging in.');
                return;
            }

            if (router.query.redirectTo) {
                // If the redirectTo query parameter is set, redirect to that page
                router.push(router.query.redirectTo);
            } else {
                // If the redirectTo query parameter is not set, redirect to the home page
                router.push('/');
            }
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                toast.error('Invalid Username or Password');
            } else {
                toast.error('Unexpected Error');
            }
        }
    };

    const handleForgotPassword = async (e, userId) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Password reset email sent');

            // Update the isMigrated flag in Firestore
            if (isMigratedUser) {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, {isMigrated: false});
            }

            clearError();
            setIsMigratedUser(false);
        } catch (error) {
            toast.error('Failed to send password reset email');
        }
    };


    const checkIfMigratedUser = async (email) => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email), where('isMigrated', '==', true));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            setShowMigratedUserError(true);
            setIsMigratedUser(true);
            const foundUserId = snapshot.docs[0].id;
            setUserId(foundUserId);
        } else {
            setError('');
            setIsMigratedUser(false);
        }
    };

    const debouncedCheckIfMigratedUser = debounce(checkIfMigratedUser, 500);

    return (
        <div>
            <form className="sign-in-form" onSubmit={handleSubmit}>
                <div className="sign-in-new-user-heading">
                    New to LitterPic?
                    <a className="sign-in-sign-up-link" href="/signup">Sign Up</a>
                </div>
                <input className="sign-in-email"
                       type="email"
                       value={email}
                       onChange={async (e) => {
                           setEmail(e.target.value);
                           await debouncedCheckIfMigratedUser(e.target.value);
                       }}
                       placeholder="Email"
                       required
                />
                <div className="signup-password-container">
                    <input className="sign-in-password"
                           type={showPassword ? 'text' : 'password'}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="Password"
                           required
                           readOnly={isMigratedUser}
                    />
                    <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="signup-password-toggle-icon"
                        onClick={togglePasswordVisibility}
                    />
                </div>
                <a
                    className="sign-in-forgot-password"
                    href="#"
                    onClick={(e) => handleForgotPassword(e, userId)}
                    role="button"
                    tabIndex="0"
                >
                    Forgot Password?
                </a>

                <button className={`sign-in-button ${isMigratedUser ? 'disabled-button' : ''}`}
                        type="submit"
                        disabled={isMigratedUser}>
                    Login
                </button>
                <ToastContainer/>
                {error && (
                    <div className="error-container">
                        <p className="error-message">{error}</p>
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="error-clear-icon"
                            onClick={clearError}
                        />
                    </div>
                )}
                {showMigratedUserError && (
                    <div className="error-container">
                        <p className="error-message">
                            Your account has been migrated from LitterPic.com, Please reset your password using the
                            <a href="#"
                               className="migrated-user-forgot-password"
                               onClick={(e) => handleForgotPassword(e, userId)}> Forgot Password </a>
                            link.
                        </p>
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="error-clear-icon"
                            onClick={() => setShowMigratedUserError(false)}
                        />
                    </div>
                )}
            </form>
        </div>
    );
}
