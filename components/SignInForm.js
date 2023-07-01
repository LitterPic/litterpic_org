import {useState} from 'react';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../lib/firebase';
import {useRouter} from 'next/router';

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();  // Get router instance

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (router.query.redirectTo) {
                // If the redirectTo query parameter is set, redirect to that page
                router.push(router.query.redirectTo);
            } else {
                // If the redirectTo query parameter is not set, redirect to the home page
                router.push('/');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form className="sign-in-form" onSubmit={handleSubmit}>
            <div className="sign-in-new-user-heading">
                New to LitterPic? <a className="sign-in-sign-up-link" href="/signup">Sign Up</a>
            </div>
            <input className="sign-in-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   placeholder="Email" required/>
            <input className="sign-in-password" type="password" value={password}
                   onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                   required/>
            <button className="sign-in-button" type="submit">Login</button>
        </form>
    );
}
