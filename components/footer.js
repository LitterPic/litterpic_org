import React from 'react';

const Footer = () => {
    const email = 'contact@litterpic.org';
    const address = 'Wells, ME, 04090';
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
    )}`;

    const handleAddressClick = () => {
        window.open(googleMapsUrl, '_blank');
    };

    return (
        <footer className="footer">
            <p>
                <a href={`mailto:${email}`}>{email}</a>
            </p>
            <p>207-200-1496</p>
            <p onClick={handleAddressClick} className="address-link">{address}</p>
            <p>©2022 by LitterPic</p>
        </footer>
    );
};

export default Footer;
