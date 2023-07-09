import React, {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Navlink from "./navlink";
import Logobar from "./logobar";
import Footer from "./footer";

const Layout = ({children}) => {
    const [showNavLinks, setShowNavLinks] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setShowNavLinks(false); // Hide nav links when path changes
    }, [router.pathname]);

    const toggleNavLinks = () => {
        setShowNavLinks(!showNavLinks);
    };

    const handleNavLinkClick = (href) => {
        setShowNavLinks(false);
        router.push(href);
    };

    return (
        <div className="nav-grid-container">
            <Logobar/>
            <div className="grid-content">
                <nav className={`nav-bar ${showNavLinks ? "mobile-nav" : ""}`}>
                    <div className="nav-links">
                        <Navlink href="/" onClick={() => handleNavLinkClick("/")}>
                            Home
                        </Navlink>
                        <Navlink href="/about" onClick={() => handleNavLinkClick("/about")}>
                            About Us
                        </Navlink>
                        <Navlink href="/volunteer" onClick={() => handleNavLinkClick("/volunteer")}>
                            Volunteer
                        </Navlink>
                        <Navlink href="/stories" onClick={() => handleNavLinkClick("/stories")}>
                            User Stories
                        </Navlink>
                        <Navlink href="/contact" onClick={() => handleNavLinkClick("/contact")}>
                            Contact
                        </Navlink>
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
    );
};

export default Layout;
