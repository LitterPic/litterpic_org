import React from "react";
import AboutMeta from "../components/AboutMeta";
import Banner from "../components/AboutBanner";
import AboutContent from "../components/AboutContent";
import BoardMembers from "../components/BoardMembers";

const About = () => {
    return (
        <div>
            <AboutMeta />
            <Banner />
            <div className="page">
                <AboutContent />
                <BoardMembers />
            </div>
        </div>
    );
};

export default About;
