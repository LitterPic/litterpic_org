import {useState, useEffect} from 'react';
import {signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail} from 'firebase/auth';
import {auth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEye, faEyeSlash, faTimes} from "@fortawesome/free-solid-svg-icons";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const [error, setError] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const clearError = () => {
        setError('');
    };

    useEffect(() => {
        // Check if the user's email is verified
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsEmailVerified(user.emailVerified);
            }
        });

        return () => unsubscribe();
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                setError('Please verify your email before logging in.');
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
                setError('Invalid Username or Password');
            } else {
                setError('Unexpected Error');
                console.error(error);
            }
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Password reset email sent');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send password reset email');
        }
    };

    return (
        <div>
            {/*{!isEmailVerified && (*/}
            {/*    <p>Please verify your email before logging in. Check your inbox for the verification email.</p>*/}
            {/*)}*/}
            <form className="sign-in-form" onSubmit={handleSubmit}>
                <div className="sign-in-new-user-heading">
                    New to LitterPic?
                    <a className="sign-in-sign-up-link" href="/signup">Sign Up</a>
                </div>
                <input className="sign-in-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="Email" required/>
                <div className="signup-password-container">
                    <input className="sign-in-password" type={showPassword ? 'text' : 'password'} value={password}
                           onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                           required/>
                    <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="signup-password-toggle-icon"
                        onClick={togglePasswordVisibility}
                    />
                </div>
                <a className="sign-in-forgot-password" href="#" onClick={handleForgotPassword} role="button"
                   tabIndex="0">Forgot Password?</a>

                <button className="sign-in-button" type="submit">Login</button>
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
            </form>
        </div>
    );
}
