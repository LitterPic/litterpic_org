import React, { useState } from "react";

const ContactForm = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    message: ''
                });
            } else {
                setSubmitStatus('error');
                console.error('Contact form error:', result.error);
            }
        } catch (error) {
            setSubmitStatus('error');
            console.error('Contact form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-container">
            <h1>Contact Us</h1>
            <form onSubmit={handleSubmit}>
                <div className="contact-form-group">
                    <label htmlFor="firstName">First Name<span className="required">*</span></label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="contact-form-group">
                    <label htmlFor="lastName">Last Name<span className="required">*</span></label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="contact-form-group">
                    <label htmlFor="email">Email<span className="required">*</span></label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="contact-form-group">
                    <label htmlFor="message">Message<span className="required">*</span></label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                    ></textarea>
                </div>

                {submitStatus === 'success' && (
                    <div className="contact-submit-response success">
                        Thank you! Your message has been sent successfully.
                    </div>
                )}

                {submitStatus === 'error' && (
                    <div className="contact-submit-response error">
                        Sorry, there was an error sending your message. Please try again.
                    </div>
                )}

                <button
                    type="submit"
                    id="contact-submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
            </form>
        </div>
    );
};

export default ContactForm;
