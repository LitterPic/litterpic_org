import React from "react";
import PrivacyMeta from "../components/PrivacyMeta";
import Banner from "../components/PrivacyBanner";
import PrivacyContent from "../components/PrivacyContent";

const Privacy = () => {
    return (
        <div>
            <PrivacyMeta />
            <Banner />
            <div className="page">
                <PrivacyContent />
            </div>
        </div>
    );
};

export default Privacy;
