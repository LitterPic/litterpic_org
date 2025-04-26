import React from "react";
import DeleteAccountMeta from "../components/DeleteAccountMeta";
import GoogleAnalytics from "../components/GoogleAnalytics";
import DeleteAccountBanner from "../components/DeleteAccountBanner";
import DeleteAccountContent from "../components/DeleteAccountContent";
import withAuth from '../components/withAuth';

const DeleteAccountPage = () => {
    return (
        <div>
            <DeleteAccountMeta />
            <GoogleAnalytics />
            <DeleteAccountBanner />
            <DeleteAccountContent />
        </div>
    );
};

export default withAuth(DeleteAccountPage);
