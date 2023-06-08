import Link from 'next/link';

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
            <div className="footer-columns">
                <div className="footer-column-1">
                    <p>
                        <a href={`mailto:${email}`}>{email}</a>
                    </p>
                    <p onClick={handleAddressClick} className="address-link">
                        {address}
                    </p>
                    <p>207-200-1496</p>
                </div>
                <div className="footer-column-2">
                    <p>©2022 by LitterPic</p>
                </div>
                <div className="footer-column-3">
                    <div className="footer-links">
                        <Link a href="/reports">Reports</Link>
                        <Link a href="/about">Directors</Link>
                        <Link a href="/privacy">Privacy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
