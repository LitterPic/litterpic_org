import React from "react";
import LoginMeta from "../components/LoginMeta";
import LoginBanner from "../components/LoginBanner";
import LoginContent from "../components/LoginContent";

const LoginPage = () => {
    return (
        <div>
            <LoginMeta />
            <LoginBanner />
            <LoginContent />
        </div>
    );
};

export default LoginPage;
