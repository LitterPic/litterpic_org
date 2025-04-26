import React from "react";
import SignInForm from "../components/SignInForm";

const LoginContent = () => (
    <div className="page">
        <div className="content">
            <h1 className="heading-text">Login</h1>
            <div className="sign-in-form">
                <SignInForm />
            </div>
        </div>
    </div>
);

export default LoginContent;
