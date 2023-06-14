import React from "react";
import Navlink from "./navlink";
import Logobar from './logobar';
import Footer from "./footer";

const Layout = ({children}) => {
    return (
        <div>
            <Logobar/>
            <nav>
                <Navlink href="/">Home</Navlink>
                <Navlink href="/stories">User Posts</Navlink>
                <Navlink href="/volunteer">Volunteer Events</Navlink>
                <Navlink href="/contact">Contact</Navlink>
                <Navlink href="/donate">Donate</Navlink>
            </nav>
            <main>{children}</main>
            <Footer/>
        </div>
    );
};

export default Layout;
