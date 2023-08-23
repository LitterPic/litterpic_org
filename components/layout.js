import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import Logobar from "./logobar";
import Footer from "./footer";
import {getAuth, onAuthStateChanged, signOut} from 'firebase/auth';
import {doc, getDoc, getFirestore} from 'firebase/firestore';
import {auth} from "../lib/firebase";

const Layout = ({children}) => {
    const [showNavLinks, setShowNavLinks] = useState(false);
    const router = useRouter();
    const [userPhoto, setUserPhoto] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [userLoggedIn, setUserLoggedIn] = useState(false);

    useEffect(() => {
        setShowNavLinks(false);
    }, [router.pathname]);

    useEffect(() => {
        const authInstance = getAuth();
        const firestore = getFirestore();
        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserLoggedIn(true);
                const userRef = doc(firestore, `users/${user.uid}`);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserPhoto(userData.photo_url);
                    setDisplayName(userData.display_name);
                } else {

                }
            } else {
                setUserLoggedIn(false);
                setUserPhoto('');
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleNavLinks = () => {
        setShowNavLinks(!showNavLinks);
    };

    const handleNavLinkClick = (href) => {
        setShowNavLinks(false);
        router.push(href);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUserLoggedIn(false);
            setUserPhoto('');
            router.push('/login');
        } catch (error) {

        }
    };

    return (
        <div className="nav-grid-container">
            <Logobar/>
            <div className="grid-content">
                <nav className={`nav-bar ${showNavLinks ? "mobile-nav" : ""}`}>
                    <div className="nav-links">
                        {userLoggedIn && showNavLinks && (
                            <img src={userPhoto} alt={displayName} className="profile-picture"/>
                        )}
                        <Link href="/" passHref>
                            <div onClick={() => handleNavLinkClick("/")}>Home
                            </div>
                        </Link>
                        <Link href="/about" passHref>
                            <div onClick={() => handleNavLinkClick("/about")}>About Us</div>
                        </Link>
                        <Link href="/volunteer" passHref>
                            <div onClick={() => handleNavLinkClick("/volunteer")}>Volunteer</div>
                        </Link>
                        <Link href="/stories" passHref>
                            <div onClick={() => handleNavLinkClick("/stories")}>User Stories</div>
                        </Link>
                        <Link href="/contact" passHref>
                            <div onClick={() => handleNavLinkClick("/contact")}>Contact</div>
                        </Link>
                        <div className={`nav-links-desktop ${"hide"}`}>
                            {userLoggedIn ? (
                                <>
                                    <Link href="/profile" passHref>
                                        <div onClick={() => handleNavLinkClick("/profile")}>Profile</div>
                                    </Link>
                                    <div className="nav-link" onClick={handleSignOut}>Log Out</div>
                                </>
                            ) : (
                                <Link href="/login" passHref>
                                    <div onClick={() => handleNavLinkClick("/login")}>Login/Sign Up</div>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className={`nav-toggle ${showNavLinks ? "active" : ""}`} onClick={toggleNavLinks}>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path
                    fill="currentColor"
                    d="M21 12c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h16c.55 0 1 .45 1 1zm0-7c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h16c.55 0 1 .45 1 1zm0 14c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h16c.55 0 1 .45 1 1z"
                />
              </svg>
            </span>
                    </div>
                </nav>
            </div>
            <main>{children}</main>
            <Footer/>
        </div>
    )
        ;
};

export default Layout;
