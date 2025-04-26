import React from "react";
import CommunityServiceMeta from "../components/CommunityServiceMeta";
import GoogleAnalytics from "../components/GoogleAnalytics";
import CommunityServiceBanner from "../components/CommunityServiceBanner";
import CommunityServiceContent from "../components/CommunityServiceContent";

const CommunityServiceHours = () => {
    return (
        <div>
            <CommunityServiceMeta />
            <GoogleAnalytics />
            <CommunityServiceBanner />
            <CommunityServiceContent />
        </div>
    );
};

export default CommunityServiceHours;
