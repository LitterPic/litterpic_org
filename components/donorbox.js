import React, {useEffect, useRef} from 'react';
import { trackEvent } from '../lib/ga';

const DonorBox = () => {
    const iframeRef = useRef(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://donorbox.org/widget.js";
        script.async = true;
        script.setAttribute('paypalExpress', 'true');
        document.body.appendChild(script);

        // Listen for DonorBox postMessage events (resize, donation_complete, etc.)
        const handleMessage = (e) => {
            if (!e.data || typeof e.data !== 'object') return;

            // Auto-resize the iframe when DonorBox reports a new height
            if (e.data.action === 'resize' && e.data.height) {
                if (iframeRef.current) {
                    iframeRef.current.style.height = e.data.height + 'px';
                }
            }

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
                ref={iframeRef}
                src="https://donorbox.org/embed/litterpic-first-campaign?default_interval=o"
                name="donorbox"
                allow="payment"
                seamless="seamless"
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
