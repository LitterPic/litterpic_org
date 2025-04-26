import React from "react";
import Script from "next/script";

const GoogleAnalytics = () => (
    <>
        <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-3VZE7E59CL"
            strategy="afterInteractive"
        />
        <Script
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-3VZE7E59CL');
                `,
            }}
        />
    </>
);

export default GoogleAnalytics;
