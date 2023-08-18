import {useRouter} from 'next/router';
import {useEffect, useRef, useState} from 'react';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {auth, db} from '../lib/firebase';
import {doc, getDoc} from 'firebase/firestore';
import CustomButton from './CustomButton';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

const Logobar = () => {
    const dropdownRef = useRef(null);
    const [user, setUser] = useState(null);
    const [userPhoto, setUserPhoto] = useState('');
    const [displayName, setDisplayName] = useState('');
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

    const handleDropdownIconClick = (event) => {
        event.stopPropagation();
        toggleDropdown();
    };

    const handleLoginClick = () => {
        router.push('/login');
    };

    const handleSignUpClick = () => {
        router.push('/signup');
    };

    useEffect(() => {
        const handleClickOutsideDropdown = (event) => {
            const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
            const clickedOnDropdownIcon = event.target.classList.contains('dropdown-icon');

            if (!clickedInsideDropdown && !clickedOnDropdownIcon) {
                setShowDropdown(false);
            } else {

            }
        };

        const handlePageNavigation = () => {
            setShowDropdown(false);
        };

        document.addEventListener('click', handleClickOutsideDropdown);
        router.events.on('routeChangeStart', handlePageNavigation);

        return () => {
            document.removeEventListener('click', handleClickOutsideDropdown);
            router.events.off('routeChangeStart', handlePageNavigation);
        };
    }, [router.events]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                const userRef = doc(db, `users/${user.uid}`);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserPhoto(userData.photo_url);
                    setDisplayName(userData.display_name);
                    setIsUserDataLoaded(true);
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
            setIsUserDataLoaded(false);
            router.push('/login');
            setShowDropdown(false);
        } catch (error) {

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
                                {isUserDataLoaded && (
                                    <img src={userPhoto} alt={displayName} className="profile-picture"/>
                                )}
                                <FontAwesomeIcon
                                    icon={faCaretDown}
                                    className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`}
                                    onClick={handleDropdownIconClick}
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
                        <div className="login-button" onMouseEnter={() => setShowDropdown(true)}
                             onMouseLeave={() => setShowDropdown(false)}>
                            <span>Login</span>
                            {showDropdown && (
                                <div className="login-menu">
                                    <button className="login-menu-button" onClick={handleLoginClick}>Login</button>
                                    <button className="login-menu-button" onClick={handleSignUpClick}>Sign Up</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Logobar;
