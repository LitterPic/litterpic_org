import {useState} from 'react';
import {createUserWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {faEye, faEyeSlash, faTimes} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            if (router.query.redirectTo) {
                router.push(router.query.redirectTo);
            } else {
                router.push('/');
            }
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setError('User already exists');
            } else if (error.code === 'auth/weak-password') {
                setError('Passwords must be at least 6 characters long');
            } else {
                setError('Unexpected Error');
                console.error(error);
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const clearError = () => {
        setError('');
    };

    return (
        <form className="signup-form" onSubmit={handleSubmit}>
            <input
                className="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <div className="signup-password-container">
                <input
                    className="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="signup-password-toggle-icon"
                    onClick={togglePasswordVisibility}
                />
            </div>
            <div className="signup-password-container">
                <input
                    className="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                />
                <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="signup-password-toggle-icon"
                    onClick={togglePasswordVisibility}
                />
            </div>
            <button className="signup-button" type="submit">
                Sign Up
            </button>
            <p className="signup-legal">By signing up, you expressly acknowledge, consent to, and agree to be
                bound by the privacy policy of LitterPic Inc. <a href="/privacy" target="_blank">privacy policy</a></p>
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
    );
}
