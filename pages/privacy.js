import React from "react";

const Privacy = () => {
    return (
        <div>
            <div className="banner">
                <img src="/images/privacy_policy_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">LitterPic Inc. Privacy Policy</h1>

                    <p>
                        At LitterPic Inc., we are committed to protecting your privacy. This Privacy Policy explains how
                        we
                        collect,
                        use, and disclose your personal information in connection with your use of our website and
                        mobile
                        app
                        (collectively, the "Services").
                    </p>

                    <h2>Information We Collect</h2>

                    <p>
                        When you use our Services, we may collect the following types of information:
                    </p>

                    <ul className="privacy-ul">
                        <li>
                            <strong>Personal Information:</strong> We may collect personal information you provide us,
                            such
                            as
                            your
                            name, email address, postal address, phone number, and payment information (if you donate).
                        </li>
                        <li>
                            <strong>User Content:</strong> We may collect the photos, stories, and other content you
                            upload
                            to
                            our
                            Services.
                        </li>
                        <li>
                            <strong>Usage Information:</strong> We may collect information about how you use our
                            Services,
                            such
                            as
                            the pages you visit, the features you use, and the time and date of your visits.
                        </li>
                        <li>
                            <strong>Device Information:</strong> We may collect information about the device you use to
                            access
                            our
                            Services, such as the device type, operating system, and browser type.
                        </li>
                    </ul>

                    <div className="blank-space"></div>
                    <h2>How We Use Your Information</h2>

                    <p>
                        We may use the information we collect for the following purposes:
                    </p>

                    <ul className="privacy-ul">
                        <li>To provide and improve our Services;</li>
                        <li>To communicate with you about your account, our Services, and other updates and
                            promotions;
                        </li>
                        <li>To analyze and understand how our Services are used;</li>
                        <li>To personalize your experience and provide you with targeted advertising;</li>
                        <li>To comply with our legal obligations and protect our rights and the rights of others; and
                        </li>
                        <li>For any other purpose with your consent.</li>
                    </ul>

                    <div className="blank-space"></div>
                    <h2>How We Share Your Information</h2>

                    <p>
                        We may share your information with third parties in the following circumstances:
                    </p>

                    <ul className="privacy-ul">
                        <li>
                            With service providers that help us operate our Services, such as payment processors and
                            hosting
                            providers;
                        </li>
                        <li>
                            With other users of our Services, as directed by you (for example, if you share your photos
                            and
                            stories
                            on our website);
                        </li>
                        <li>
                            When we believe in good faith that disclosure is necessary to comply with applicable law or
                            legal
                            process, to prevent fraud, or to protect our rights and the rights of others.
                        </li>
                    </ul>

                    <div className="blank-space"></div>
                    <h2>Your Choices</h2>

                    <p>
                        Depending on your location and applicable law, you may have certain rights and choices
                        concerning
                        your
                        personal information. For example:
                    </p>

                    <ul className="privacy-ul">
                        <li>You may opt out of receiving promotional communications from us by following the
                            instructions in
                            those
                            communications or by contacting us directly.
                        </li>
                        <li>You may have the right to access, correct, or delete your personal information and object to
                            or
                            restrict
                            specific processing of your personal information.
                        </li>
                    </ul>

                    <div className="blank-space"></div>
                    <h2>Security</h2>
                    <p>
                        We take reasonable measures to protect your personal information from loss, theft, unauthorized
                        access,
                        disclosure, alteration, and destruction. However, no method of transmission over the Internet or
                        method
                        of
                        electronic storage is 100% secure.
                    </p>

                    <div className="blank-space"></div>
                    <h2>Changes to this Policy</h2>

                    <p>
                        We may update this Privacy Policy from time to time. If we make material changes, we will notify
                        you
                        by
                        email or posting a notice on our website before the change becomes effective. Your continued use
                        of
                        our
                        Services after we make changes is deemed to be acceptance of those changes.
                    </p>

                    <div className="blank-space"></div>
                    <h2>Contact Us</h2>

                    <p>
                        If you have any questions or concerns about this Privacy Policy, please get in touch with us at
                        {' '}
                        {/*<a href="mailto:contact@litterpic.com">contact@litterpic.org</a>.*/}
                    </p>
                </div>
            </div>
        </div>
    );
};


export default Privacy;
