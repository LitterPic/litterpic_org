import React from 'react';
import VerifyEmailMeta from '../components/VerifyEmailMeta';
import VerifyEmailBanner from '../components/VerifyEmailBanner';
import VerifyEmailContent from '../components/VerifyEmailContent';

const Verify_email = () => {
    return (
        <div>
            <VerifyEmailMeta />
            <VerifyEmailBanner />
            <VerifyEmailContent />
        </div>
    );
};

export default Verify_email;
