import React, {useState} from 'react';

const Contact = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState("I'd like more information please");
    const [message, setMessage] = useState('');

    const handleEmailLink = (e) => {
        e.preventDefault();

        const emailBody = `${message}`;
        window.location.href = `mailto:contact@litterpic.org?subject=${encodeURIComponent(
            subject
        )}&body=${encodeURIComponent(emailBody)}`;
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/AboutUsBanner.webp" alt="Banner Image"/>
            </div>

            <div className="contact-wrapper">
                <div className="contact-container">
                    <h1>Contact Us</h1>
                    <form onSubmit={handleEmailLink}>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                className="contact-input"
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject</label>
                            <input
                                className="contact-input"
                                type="text"
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
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

                        <div className="contact_button_div">
                            <button type="submit">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
