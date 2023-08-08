import React, {useEffect, useState} from 'react';
import {getAuth, onAuthStateChanged, signOut} from 'firebase/auth';
import {auth} from '../lib/firebase';
import Link from "next/link";

const VerifyEmailPage = () => {
    return (
        <div>
            <div className="banner">
                <img src="/images/verifyEmailBanner.jpeg" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Verify Your Email</h1>
                    <p>
                        Thank you for signing up! An email verification link has been sent to your inbox.
                        Please check your email and click on the link to activate your account.
                    </p>
                    <Link href="/stories">
                        <button className="ok-button">OK</button>
                    </Link>
                </div>
            </div>
        </div>
    )
        ;
};

export default VerifyEmailPage;
