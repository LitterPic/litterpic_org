import React from "react";
import Navlink from "./navlink";
import Logobar from '../components/logobar';
import Footer from "../components/footer";

const Layout = ({children}) => {
    return (
        <div>
            <Logobar/>
            <nav>
                <Navlink href="/">Home</Navlink>
                <Navlink href="/stories">Stories</Navlink>
                <Navlink href="/volunteer">Volunteer Events</Navlink>
                <Navlink href="/community_service_hours">Community Service Hours</Navlink>
                <Navlink href="/donate">Donate</Navlink>
                <Navlink href="/about">About</Navlink>
                <Navlink href="/contact">Contact</Navlink>
            </nav>
            <main>{children}</main>
            <Footer/>
        </div>
    );
};

export default Layout;
