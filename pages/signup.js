import SignUpForm from '../components/SignUpForm';
import React from "react";

export default function LoginPage() {
    return (
        <div>
            <div className="banner">
                <img src="/images/AboutUsBanner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Welcome,</h1>
                    <div className="signup-form">
                        <SignUpForm/>
                    </div>
                </div>
            </div>
        </div>
    );
}
