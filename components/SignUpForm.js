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

    const [hasUpperCase, setHasUpperCase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);
    const [isLongEnough, setIsLongEnough] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(false);

    const router = useRouter();

    const handlePasswordChange = (e) => {
        const pass = e.target.value;
        setPassword(pass);

        setHasUpperCase(/[A-Z]/.test(pass));
        setHasNumber(/\d/.test(pass));
        setHasSpecialChar(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass));
        setIsLongEnough(pass.length >= 6);
        setPasswordMatch(pass === confirmPassword && pass !== '' && confirmPassword !== '');
    }

    const handleConfirmPasswordChange = (e) => {
        const confirmPass = e.target.value;
        setConfirmPassword(confirmPass);
        setPasswordMatch(password === confirmPass && password !== '' && confirmPass !== '');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!hasUpperCase || !hasNumber || !hasSpecialChar || !isLongEnough) {
            setError('Password does not meet requirements');
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);

            // Redirect the user to the stories page
            await router.push('/stories');
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

    const checkMark = hasUpperCase && hasNumber && hasSpecialChar && isLongEnough && passwordMatch ? '✓' : ' ';

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
                    onChange={handlePasswordChange}
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
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm Password"
                    required
                />
                <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="signup-password-toggle-icon"
                    onClick={togglePasswordVisibility}
                />
            </div>
            {(password !== '' || confirmPassword !== '') && (
                <div className="signup-password-requirements">
                    <p className={hasUpperCase ? 'valid-password-attribute' : 'invalid-password-attribute'}>{checkMark} Password
                        must have an uppercase letter</p>
                    <p className={hasNumber ? 'valid-password-attribute' : 'invalid-password-attribute'}>{checkMark} Password
                        must have a number</p>
                    <p className={hasSpecialChar ? 'valid-password-attribute' : 'invalid-password-attribute'}>{checkMark} Password
                        must have a special character</p>
                    <p className={isLongEnough ? 'valid-password-attribute' : 'invalid-password-attribute'}>{checkMark} Password
                        must be at least 6 characters
                        long</p>
                    <p className={passwordMatch ? 'valid-password-attribute' : 'invalid-password-attribute'}>{checkMark} Password
                        and Confirm Password fields must match</p>
                </div>
            )}
            <button className="signup-button"
                    type="submit"
                    disabled={!hasUpperCase || !hasNumber || !hasSpecialChar || !isLongEnough || !passwordMatch}>
                Sign Up
            </button>
            <p className="signup-legal">By signing up, you expressly acknowledge, consent to, and agree to be
                bound by the privacy policy of LitterPic Inc.
                <a href="/privacy" target="_blank">privacy policy</a>
            </p>
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
