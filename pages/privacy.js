import React from "react";
import PrivacyMeta from "../components/PrivacyMeta";
import GoogleAnalytics from "../components/GoogleAnalytics";
import Banner from "../components/PrivacyBanner";
import PrivacyContent from "../components/PrivacyContent";

const Privacy = () => {
    return (
        <div>
            <PrivacyMeta />
            <GoogleAnalytics />
            <Banner />
            <div className="page">
                <PrivacyContent />
            </div>
        </div>
    );
};

export default Privacy;
