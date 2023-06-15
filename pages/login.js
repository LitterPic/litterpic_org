import SignInForm from '../components/SignInForm';
import React from "react"; // adjust path according to your file structure

export default function LoginPage() {
    return (
        <div>
            <div className="banner">
                <img src="/images/AboutUsBanner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Login</h1>
                    <div className="sign-in-form">
                        <SignInForm/>
                    </div>
                </div>
            </div>
        </div>
    );
}
