import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debounce } from 'lodash';
import SignInInputs from './SignInInputs';
import SignInActions from './SignInActions';
import { checkIfMigratedUser } from '../lib/authUtils';

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isMigratedUser, setIsMigratedUser] = useState(false);
    const [userId, setUserId] = useState(null);
    const [showMigratedUserError, setShowMigratedUserError] = useState(false);
    const router = useRouter();

    const debouncedCheckIfMigratedUser = debounce(checkIfMigratedUser, 500);

    useEffect(() => {
        debouncedCheckIfMigratedUser(email, setIsMigratedUser, setShowMigratedUserError, setUserId);
        return () => debouncedCheckIfMigratedUser.cancel();
    }, [email]);

    return (
        <div>
            <SignInInputs
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isMigratedUser={isMigratedUser}
            />
            <SignInActions
                email={email}
                password={password}
                isMigratedUser={isMigratedUser}
                userId={userId}
                showMigratedUserError={showMigratedUserError}
                setShowMigratedUserError={setShowMigratedUserError}
                router={router}
            />
            <ToastContainer />
        </div>
    );
}
