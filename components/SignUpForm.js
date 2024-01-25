import {useState} from 'react';
import {createUserWithEmailAndPassword, sendEmailVerification, signOut} from 'firebase/auth';
import {auth} from '../lib/firebase'
import {useRouter} from 'next/router';
import {doc, getFirestore, serverTimestamp, setDoc} from 'firebase/firestore';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {subscribeUserToMail} from '../utils/subscribeUserToMail';

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLongEnough, setIsLongEnough] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(false);

    const router = useRouter();

    const handlePasswordChange = (e) => {
        const pass = e.target.value;
        setPassword(pass);

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
            toast.error('Passwords do not match');
            return;
        }

        if (!isLongEnough) {
            toast.error('Password does not meet requirements');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            if (!auth.currentUser) {

            } else {

            }
            // Create the user document in Firestore
            const db = getFirestore();
            const userDocRef = doc(db, 'users', user.uid);

            await setDoc(userDocRef, {
                ambassador: false,
                created_time: serverTimestamp(),
                email: user.email,
                uid: user.uid,
                photo_url: "https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg",
                organization: "Independent",
                first_login: true,
            }, {merge: true});

            // Add user to SendGrid subscription list
            await subscribeUserToMail(user.email, "Member");

            // Log out the user immediately after account creation
            await signOut(auth);

            // Redirect the user to the stories page
            await router.push('/verify-email-page');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                toast.error('User already exists');
            } else if (error.code === 'auth/weak-password') {
                toast.error('Passwords must be at least 6 characters long');
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    };


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const checkMark = isLongEnough && passwordMatch ? '✓' : ' ';

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
                <i
                    className={`material-icons signup-password-toggle-icon`}
                    onClick={togglePasswordVisibility}
                >
                    {showPassword ? 'visibility_off' : 'visibility'}
                </i>
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
                <i
                    className="material-icons signup-password-toggle-icon"
                    onClick={togglePasswordVisibility}
                >
                    {showPassword ? 'visibility_off' : 'visibility'}
                </i>

            </div>
            {(password !== '' || confirmPassword !== '') && (
                <div className="signup-password-requirements">
                    <p className={isLongEnough ? 'valid-password-attribute' : 'invalid-password-attribute'}>
                        {isLongEnough ? '✓' : checkMark} Password {isLongEnough ? 'is' : "isn't"} at least 6 characters
                        in length
                    </p>
                    <p className={passwordMatch ? 'valid-password-attribute' : 'invalid-password-attribute'}>
                        {passwordMatch ? '✓' : checkMark} Password fields {passwordMatch ? 'match' : "don't match"}
                    </p>
                </div>
            )}
            <button className="signup-button"
                    type="submit"
                    disabled={!isLongEnough || !passwordMatch}>
                Sign Up
            </button>
            <p className="signup-legal">By signing up, you expressly acknowledge, consent to, and agree to be
                bound by the privacy policy of LitterPic Inc.
                <a href="/privacy" target="_blank">privacy policy</a>
            </p>
            <ToastContainer/>
        </form>
    );
}
