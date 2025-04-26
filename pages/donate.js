import React from "react";
import DonateMeta from "../components/DonateMeta";
import GoogleAnalytics from "../components/GoogleAnalytics";
import DonateBanner from "../components/DonateBanner";
import DonateContent from "../components/DonateContent";

const Donate = () => {
    return (
        <div>
            <DonateMeta />
            <GoogleAnalytics />
            <DonateBanner />
            <div className="page">
                <DonateContent />
            </div>
        </div>
    );
};

export default Donate;
