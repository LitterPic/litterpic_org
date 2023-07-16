import Link from 'next/link';

const Footer = () => {
    const address = 'Wells, ME 04090';
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
    )}`;

    const handleAddressClick = () => {
        window.open(googleMapsUrl, '_blank');
    };

    return (
        <footer className="footer">
            <div className="footer-column-1">
                <p onClick={handleAddressClick} className="address-link">
                    {address}
                </p>
                <p>207-200-1496</p>
            </div>
            <div className="footer-column-2">
                <p>©2022</p>
                <p>LitterPic</p>
            </div>
            <div className="footer-column-3">
                <div className="footer-links">
                    <Link href="/reports">Reports</Link>
                    <Link href="/privacy">Privacy</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
