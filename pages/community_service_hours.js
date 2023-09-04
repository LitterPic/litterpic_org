import React from "react";
import Head from "next/head";

const Community_Service_Hours = () => {
    return (
        <div>
            <Head>
                <title>LitterPic supports Community Service</title>
                <meta name="description"
                      content="Earn community service hours with LitterPic by cleaning littered areas and sharing your efforts.
                      Ensure safe cleanups, post before-and-after photos, and request validation at contact@litterpic.org.
                      We verify all submissions for authenticity and provide proof of service. Join us in making communities cleaner!"/>
                <meta name="robots" content="index, follow"/>
                <link rel="canonical" href="https://litterpic.org/community_service_hours"/>

                <meta property="og:title" content="LitterPic"/>
                <meta property="og:description"
                      content="Earn community service hours with LitterPic by cleaning littered areas and sharing your efforts.
                      Ensure safe cleanups, post before-and-after photos, and request validation at contact@litterpic.org.
                      We verify all submissions for authenticity and provide proof of service. Join us in making communities cleaner!"/>
                <meta property="og:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/userPosts%2FgiV8aaisrLNCA6pQYSOS%2F1.webp?alt=media&token=a62f6ea3-2b54-4930-aa91-4e4d2076c39e"/>
                <meta property="og:url" content="https://litterpic.org/community_service_hours"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="LitterPic"/>
                <meta name="twitter:description"
                      content="Earn community service hours with LitterPic by cleaning littered areas and sharing your efforts.
                      Ensure safe cleanups, post before-and-after photos, and request validation at contact@litterpic.org.
                      We verify all submissions for authenticity and provide proof of service. Join us in making communities cleaner!"/>
                <meta name="twitter:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/userPosts%2FgiV8aaisrLNCA6pQYSOS%2F1.webp?alt=media&token=a62f6ea3-2b54-4930-aa91-4e4d2076c39e"/>
            </Head>
            <div className="banner">
                <img src="/images/AboutUsBanner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Community Service Hours</h1>
                    <p>
                        At LitterPic, we extend our deepest gratitude to all volunteers who have chosen us as their
                        nonprofit
                        organization to complete their community service hours. We appreciate your dedication and
                        commitment
                        to
                        making the world cleaner and healthier. To complete your community service hours with LitterPic,
                        please
                        ensure that you:
                    </p>
                    <br/>
                    <div className="blank-space"></div>
                    <ol>
                        <li>Clean a littered area of your choice; take before and after pictures to show off your
                            efforts
                            and
                            inspire others.
                        </li>
                        <li>After taking photos of the litter and litter bags collected, correctly recycle and dispose
                            of
                            the
                            litter.
                        </li>
                        <li>Create a post with before and after pictures of collected litter and a picture of the litter
                            bags
                            collected.
                        </li>
                        <li>Comply with safety guidelines, wear appropriate clothing and equipment, and follow all laws
                            and
                            regulations during the cleanup.
                        </li>
                    </ol>
                    <div className="blank-space"></div>
                    <p>
                        You can request validation of your service hours and obtain proof through LitterPic by
                        emailing {' '}
                        <a href="mailto:contact@litterpic.org">contact@litterpic.org</a>
                        .
                    </p>
                    <p>
                        In your email, please provide your name, LitterPic.org login email, the number of hours needing
                        verification, and the contact information of the requesting party. After we validate your posts,
                        we
                        will
                        gladly issue a letter to the relevant requesting party.
                    </p>
                    <p>
                        LitterPic will diligently verify the photo metadata and cross-check the recorded hours with the
                        accompanying visuals to ensure the authenticity of all submissions; LitterPic reserves the right
                        to
                        request original photos taken to resolve any discrepancies. We are eagerly anticipating
                        witnessing
                        the
                        positive impact that your contributions will bring about in your community.
                    </p>
                    <p>
                        Please don't hesitate to reach out if you have any questions.
                    </p>
                </div>
            </div>
        </div>
    );
}


export default Community_Service_Hours;