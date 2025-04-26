import React from "react";
import LoginMeta from "../components/LoginMeta";
import GoogleAnalytics from "../components/GoogleAnalytics";
import LoginBanner from "../components/LoginBanner";
import LoginContent from "../components/LoginContent";

const LoginPage = () => {
    return (
        <div>
            <LoginMeta />
            <GoogleAnalytics />
            <LoginBanner />
            <LoginContent />
        </div>
    );
};

export default LoginPage;
