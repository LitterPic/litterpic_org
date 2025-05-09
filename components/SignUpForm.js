import {useState} from 'react';
import {createUserWithEmailAndPassword, sendEmailVerification, signOut} from 'firebase/auth';
import {auth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {doc, getFirestore, serverTimestamp, setDoc, getDocs, collection, query, where} from 'firebase/firestore';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {subscribeUserToMail} from '../utils/subscribeUserToMail';
import {sendNewUserEnrollmentEmail} from "../utils/emailService";

export default function SignUpForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLongEnough, setIsLongEnough] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Function to check if display name already exists in Firestore
    const checkDisplayNameExists = async (displayName) => {
        const db = getFirestore();
        const usersRef = collection(db, 'users');

        // Fetch all potential matching documents and filter client-side for case-insensitive match
        const querySnapshot = await getDocs(usersRef);

        // Perform case-insensitive comparison on the client side
        return querySnapshot.docs.some(doc => {
            const userData = doc.data();
            // Check if display_name exists and is not null/undefined before calling toLowerCase()
            return userData && 
                   userData.display_name && 
                   userData.display_name.toLowerCase() === displayName.toLowerCase();
        });
    };

    const generateUniqueDisplayName = async (baseName) => {
        let displayName = baseName;
        let counter = 1;
        // Check if the base name exists, and if so, append numbers until a unique name is found
        while (await checkDisplayNameExists(displayName)) {
            displayName = `${baseName}${counter}`;
            counter++;
        }
        return displayName;
    };

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

        setIsSubmitting(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            // Get base display name from the email
            let displayName = user.email.split('@')[0];

            // Generate a unique display name
            displayName = await generateUniqueDisplayName(displayName);

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
                display_name: displayName, // Use the unique display name
            }, {merge: true});

            try {
                // Add user to SendGrid subscription list
                await subscribeUserToMail(user.email, "Member");
            } catch (subscribeError) {
                console.error('Error subscribing user to mailing list:', subscribeError);
                // Continue with the signup process even if subscription fails
                // But show a toast notification about the partial success
                toast.warning('Account created, but there was an issue with the mailing list subscription');
            }

            try {
                // Send email notification about the new user enrollment
                await sendNewUserEnrollmentEmail("contact@litterpic.org", user.email);
            } catch (subscribeError) {
                console.error('Error sending new user enrollment email for user to mailing list:', subscribeError);
            }

            // Log out the user immediately after account creation
            await signOut(auth);

            // Show success message to the user
            toast.success('Account created successfully! Please check your email to verify your account.');

            // We don't set isSubmitting to false here because we want the spinner to continue showing
            // until the redirect happens, providing continuous feedback to the user

            // Add a delay before redirecting to give users time to read the toast message
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Redirect the user to the home page
            await router.push('/');
        } catch (error) {
            setIsSubmitting(false);
            console.error('Signup error:', error);

            if (error.code === 'auth/email-already-in-use') {
                toast.error('User already exists');
            } else if (error.code === 'auth/weak-password') {
                toast.error('Passwords must be at least 6 characters long');
            } else {
                toast.error(`Error: ${error.message || 'An unexpected error occurred'}`);
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
            {isSubmitting ? (
                <div className="signup-button disabled">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <button className="signup-button"
                        type="submit"
                        disabled={!isLongEnough || !passwordMatch}>
                    Sign Up
                </button>
            )}
            <p className="signup-legal">By signing up, you expressly acknowledge, consent to, and agree to be
                bound by the privacy policy of LitterPic Inc.
                <a href="/privacy" target="_blank">privacy policy</a>
            </p>
            <ToastContainer/>
        </form>
    );
}
