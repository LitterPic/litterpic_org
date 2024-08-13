import {useRouter} from 'next/router';
import {useEffect, useRef, useState} from 'react';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {auth, db} from '../lib/firebase';
import {collection, doc, getDoc, onSnapshot, query, where} from 'firebase/firestore';
import CustomButton from './CustomButton';

const Logobar = () => {
    const dropdownRef = useRef(null);
    const [user, setUser] = useState(null);
    const [userPhoto, setUserPhoto] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);

            if (user) {
                const fetchUserData = async () => {
                    try {
                        const userRef = doc(db, `users/${user.uid}`);
                        const userDoc = await getDoc(userRef);

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUserPhoto(userData.photo_url);
                            setDisplayName(userData.display_name);
                            setIsUserDataLoaded(true);

                            // Fetch unread notifications in real-time
                            const notificationsQuery = query(
                                collection(db, `users/${user.uid}/notifications`),
                                where('isRead', '==', false)
                            );

                            onSnapshot(notificationsQuery, (snapshot) => {
                                setUnreadNotifications(snapshot.size);
                            });
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                    }
                };

                fetchUserData();
            } else {
                setUserPhoto(null);
                setDisplayName('');
                setUnreadNotifications(0);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsUserDataLoaded(false);
            setShowDropdown(false);
            setUnreadNotifications(0);
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleProfileClick = () => {
        router.push('/profile');
        setShowDropdown(false);
    };

    const toggleDropdown = () => {
        setShowDropdown((prevState) => !prevState);
    };

    const handleNotificationsClick = () => {
        router.push('/notifications'); // Navigate to the notifications page
    };

    const handleLoginClick = () => {
        router.push('/login');
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
                    <div className="notification-icon" onClick={handleNotificationsClick}
                         style={{position: 'relative', cursor: 'pointer'}}>
                        <i className="material-icons" style={{fontSize: '36px', color: '#015E41'}}>
                            notifications
                        </i>
                        {unreadNotifications > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-10px',
                                backgroundColor: 'red',
                                borderRadius: '50%',
                                padding: '5px 10px',
                                color: 'white',
                                fontSize: '12px'
                            }}>
                                {unreadNotifications}
                            </span>
                        )}
                    </div>

                    <CustomButton href="/donate">Click to Donate</CustomButton>

                    <div className="profile-dropdown">
                        <div className="profile-picture-wrapper" onClick={toggleDropdown}>
                            {isUserDataLoaded && (
                                <img src={userPhoto} alt={displayName} className="profile-picture"/>
                            )}
                            <i
                                className={`material-icons dropdown-icon ${showDropdown ? 'rotate-up' : 'rotate-down'}`}
                                onClick={toggleDropdown}
                            >
                                arrow_drop_down
                            </i>
                        </div>
                        {showDropdown && (
                            <div className="dropdown-menu" ref={dropdownRef}>
                                <button className="logo-profile-menu-button" onClick={handleProfileClick}>Profile
                                </button>
                                <button className="signout-profile-menu-button" onClick={handleSignOut}>Log Out</button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="logo-bar-right-content">
                    <CustomButton href="/donate">Donate</CustomButton>
                    <div className="login-button" onClick={handleLoginClick}>
                        <span>Login / Sign Up</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logobar;
