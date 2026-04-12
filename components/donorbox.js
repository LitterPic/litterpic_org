import React, {useEffect} from 'react';
import { trackEvent } from '../lib/ga';

const DonorBox = () => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://donorbox.org/widget.js";
        script.async = true;
        script.paypalExpress = "true";
        document.body.appendChild(script);

        // Listen for DonorBox postMessage events (donation_complete, etc.)
        const handleMessage = (e) => {
            if (!e.data || typeof e.data !== 'object') return;
            const eventType = e.data.event || '';
            if (eventType.includes('donation_complete') || eventType.includes('donation_submitted')) {
                trackEvent('donate_completed', {
                    amount: e.data.amount || undefined,
                    currency: e.data.currency || 'USD',
                    campaign: e.data.campaign || 'litterpic-first-campaign',
                });
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            document.body.removeChild(script);
            window.removeEventListener('message', handleMessage);
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
