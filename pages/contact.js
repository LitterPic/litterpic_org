import React, {useState} from 'react';

const Contact = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleEmailLink = (e) => {
        e.preventDefault();

        const subject = "LitterPic.org inquiry";

        const emailBody = `${message}`;
        window.location.href = `mailto:contact@litterpic.org?subject=${encodeURIComponent(
            subject
        )}&body=${encodeURIComponent(emailBody)}`;
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/contact_us_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Contact</h1>
                    <div className="contact-wrapper">
                        <div className="contact-container">
                            <form onSubmit={handleEmailLink}>
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        className="contact-input"
                                        type="text"
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        className="contact-input"
                                        type="text"
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        className="contact-input"
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        className="contact-textarea"
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="contact-submit-button">
                                    <button type="submit">Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
