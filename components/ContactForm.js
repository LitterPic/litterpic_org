import React from "react";

const ContactForm = () => (
    <div className="contact-container">
        <h1>Contact Us</h1>
        <form>
            <div className="contact-form-group">
                <label htmlFor="firstName">First Name<span className="required">*</span></label>
                <input type="text" id="firstName" name="firstName" required />
            </div>
            <div className="contact-form-group">
                <label htmlFor="lastName">Last Name<span className="required">*</span></label>
                <input type="text" id="lastName" name="lastName" required />
            </div>
            <div className="contact-form-group">
                <label htmlFor="email">Email<span className="required">*</span></label>
                <input type="email" id="email" name="email" required />
            </div>
            <div className="contact-form-group">
                <label htmlFor="message">Message<span className="required">*</span></label>
                <textarea id="message" name="message" required></textarea>
            </div>
            <button type="submit" id="contact-submit-button">Submit</button>
        </form>
    </div>
);

export default ContactForm;
