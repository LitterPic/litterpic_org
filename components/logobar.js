import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {auth, db} from '../lib/firebase';
import {doc, getDoc} from 'firebase/firestore';
import CustomButton from './CustomButton';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

const Logobar = () => {
    const [user, setUser] = useState(null);
    const [userPhoto, setUserPhoto] = useState('');
    const [displayName, setDisplayName] = useState('');
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false); // Track dropdown visibility

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            // Retrieve additional user details from Firestore
            if (user) {
                const userRef = doc(db, `users/${user.uid}`);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserPhoto(userData.photo_url);
                    setDisplayName(userData.display_name);
                } else {
                    console.log('No such document!');
                }
            } else {
                setUserPhoto(null);
                setDisplayName('');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            router.push('/login');
            setShowDropdown(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleProfileClick = async () => {
        router.push('/profile');
        setShowDropdown(false);
    }

    const toggleDropdown = () => {
        setShowDropdown((prevState) => !prevState);
    };

    return (
        <div className="logo-bar">
            <div className="logo-bar-left-content">
                <div className="logo-content">
                    <img
                        src="/images/litter_pic_logo.png"
                        alt="LitterPic logo"
                        width={100}
                        height={100}
                        onClick={() => router.push('/')}
                    />
                    <div className="logo-text">
                        <p className="logo">LitterPic</p>
                        <p className="tagline">Inspire Change</p>
                    </div>
                </div>
            </div>
            {user ? (
                    <div className="logo-bar-right-content">
                        <CustomButton href="/donate">Donate</CustomButton>
                        <div className="profile-dropdown">
                            <div className="profile-picture-wrapper" onClick={toggleDropdown}>
                                <img src={userPhoto} alt={displayName} className="profile-picture"/>
                                <FontAwesomeIcon
                                    icon={faCaretDown}
                                    className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`}
                                />
                            </div>
                            {showDropdown && (
                                <div className="dropdown-menu">
                                    <button className="logo-profile-menu-button" onClick={handleProfileClick}>Profile
                                    </button>
                                    <button className="signout-profile-menu-button" onClick={handleSignOut}>Log Out</button>
                                </div>
                            )}
                        </div>
                    </div>
                ) :
                (
                    <div className="logo-bar-right-content">
                        <CustomButton href="/donate">Donate</CustomButton>
                        {/*<button className="login-button" onClick={() => router.push('/login')}>Login</button>*/}
                    </div>
                )}
        </div>
    );
};

export default Logobar;
