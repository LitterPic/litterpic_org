import React, {useEffect} from 'react';

const DonorBox = () => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://donorbox.org/widget.js";
        script.async = true;
        script.paypalExpress = "true";
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="donorbox-container">
            <iframe
                src="https://donorbox.org/embed/litterpic-first-campaign?default_interval=o"
                name="donorbox"
                allow="payment"
                frameBorder="0"
                scrolling="no"
                height="900px"
                width="100%"
                style={{maxWidth: "100%", minWidth: "100%", maxHeight: "none"}}
                title="Donation Form"
            />
        </div>
    );
};

export default DonorBox;
