import React from 'react';
import VerifyEmailMeta from '../components/VerifyEmailMeta';
import VerifyEmailBanner from '../components/VerifyEmailBanner';
import VerifyEmailContent from '../components/VerifyEmailContent';
import GoogleAnalytics from "../components/GoogleAnalytics";

const Verify_email = () => {
    return (
        <div>
            <VerifyEmailMeta />
            <GoogleAnalytics />
            <VerifyEmailBanner />
            <VerifyEmailContent />
        </div>
    );
};

export default Verify_email;
