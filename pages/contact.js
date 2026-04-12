import React from "react";
import ContactMeta from "../components/ContactMeta";
import ContactBanner from "../components/ContactBanner";
import ContactForm from "../components/ContactForm";

const Contact = () => {
    return (
        <div>
            <ContactMeta />
            <ContactBanner />
            <div className="page">
                <ContactForm />
            </div>
        </div>
    );
};

export default Contact;
