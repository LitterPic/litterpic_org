import React, { useEffect } from "react";
import DonateMeta from "../components/DonateMeta";
import DonateBanner from "../components/DonateBanner";
import DonateContent from "../components/DonateContent";
import { trackEvent } from '../lib/ga';

const Donate = () => {
    useEffect(() => {
        trackEvent('donate_page_viewed');
    }, []);

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
