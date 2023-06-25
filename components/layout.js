import React from "react";
import Navlink from "./navlink";
import Logobar from './logobar';
import Footer from "./footer";

const Layout = ({children}) => {
    return (
        <div className="nav-grid-container">
            <Logobar/>
            <div className="grid-content">
                <nav className="nav-column">
                    <Navlink href="/">Home</Navlink>
                    <Navlink href="/about">About Us</Navlink>
                    <Navlink href="/volunteer">Volunteer</Navlink>
                    <Navlink href="/stories">User Stories</Navlink>
                    <Navlink href="/contact">Contact</Navlink>
                </nav>
            </div>
            <main>{children}</main>
            <Footer/>
        </div>
    );
};

export default Layout;