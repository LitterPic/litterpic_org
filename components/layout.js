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
                <Navlink href="/volunteer">Volunteer Events</Navlink>
                <Navlink href="/community_service_hours">Community Service Hours</Navlink>
                <Navlink href="/donate">Donate</Navlink>
                <Navlink href="/contact">Contact</Navlink>
            </nav>
            <hr className="line"/>
            <main>{children}</main>
            <Footer/>
        </div>
    );
};

export default Layout;
