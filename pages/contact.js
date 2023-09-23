import React, {useState} from 'react';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from "next/head";
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";

const Contact = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = {
            firstName,
            lastName,
            email,
            message,
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('Thank you for contacting us, someone will be in touch soon!');
                setFirstName('');
                setLastName('');
                setEmail('');
                setMessage('');
            } else {
                toast.error('Failed to send email. Please try again later.');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again later.');
        }
    };

    return (
        <div>
            <Head>
                <title>Contact LitterPic</title>
                <meta name="description"
                      content="Reach out to LitterPic's dedicated team via our 'Contact Us' page. Whether you have
                      questions, feedback, or collaboration ideas, we're here to listen and assist. Let's connect and
                      work towards a cleaner planet together!"/>
                <meta name="robots" content="index, follow"/>
                {/*<link rel="canonical" href="https://litterpic.org/contact"/>*/}

                <meta property="og:title" content="LitterPic"/>
                <meta property="og:description"
                      content="Reach out to LitterPic's dedicated team via our 'Contact Us' page. Whether you have
                      questions, feedback, or collaboration ideas, we're here to listen and assist. Let's connect and
                      work towards a cleaner planet together!"/>
                <meta property="og:image"
                      content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta property="og:url" content="https://litterpic.org/contact"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="LitterPic"/>
                <meta name="twitter:description"
                      content="Reach out to LitterPic's dedicated team via our 'Contact Us' page. Whether you have
                      questions, feedback, or collaboration ideas, we're here to listen and assist. Let's connect and
                      work towards a cleaner planet together!"/>
                <meta name="twitter:image"
                      content="https://litterpic.org/images/litter_pic_logo.png"/>
            </Head>
            <div className="banner">
                <img src="/images/contact_us_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Contact</h1>
                    <div className="contact-wrapper">
                        <div className="contact-container">
                            <div className="contact-lets-chat">Send us a message</div>
                            <div className="contact-phone-email-social">
                                <div className="contact-phone">
                                    <p className="contact-heading">Phone</p>
                                    <p>(207) 200-1496</p>
                                </div>
                                <div className="contact-email">
                                    <p className="contact-heading">Email</p>
                                    <p>contact@litterpic.org</p>
                                </div>
                                <div className="contact-social">
                                    <p className="contact-heading">Social Media</p>
                                    <div className="social-icons">
                                        <a href="https://www.facebook.com/LitterPic/" target="_blank"
                                           rel="noopener noreferrer">
                                            <i className="fab fa-facebook-f facebook-icon"></i>
                                        </a>
                                        <a href="https://www.instagram.com/littrpic/" target="_blank"
                                           rel="noopener noreferrer">
                                            <i className="fab fa-instagram instagram-icon"></i>
                                        </a>
                                        <a href="https://www.linkedin.com/company/litterpic" target="_blank"
                                           rel="noopener noreferrer">
                                            <i className="fab fa-linkedin linkedin-icon"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="contact-form-row">
                                    <div className="contact-form-group">
                                        <label htmlFor="firstName">
                                            First Name <sup className="required">*</sup>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="contact-form-group">
                                        <label htmlFor="lastName">
                                            Last Name <sup className="required">*</sup>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="contact-form-group">
                                        <label htmlFor="email">
                                            Email <sup className="required">*</sup>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="contact-form-group">
                                    <label htmlFor="message">Message <sup className="required">*</sup></label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => {
                                            const capitalizedText = capitalizeFirstWordOfSentences(e.target.value);
                                            setMessage(capitalizedText);
                                        }}
                                        required
                                    ></textarea>
                                </div>
                                <button id="contact-submit-button" type="submit">Send</button>
                                <ToastContainer/>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Contact;
