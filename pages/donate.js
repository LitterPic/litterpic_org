import React from "react";
import DonateMeta from "../components/DonateMeta";
import DonateBanner from "../components/DonateBanner";
import DonateContent from "../components/DonateContent";

const Donate = () => {
    return (
        <div>
            <DonateMeta />
            <DonateBanner />
            <div className="page">
                <DonateContent />
            </div>
        </div>
    );
};

export default Donate;
