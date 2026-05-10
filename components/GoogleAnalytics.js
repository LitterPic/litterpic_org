import { useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import { GA_MEASUREMENT_ID } from "../lib/ga";

const GoogleAnalytics = () => {
    const router = useRouter();

    useEffect(() => {
        const handleRouteChange = (url) => {
            if (typeof window.gtag !== "function") return;
            setTimeout(() => {
                window.gtag("event", "page_view", {
                    page_path: url,
                    page_location: window.location.origin + url,
                    page_title: document.title,
                });
            }, 50);
        };

        router.events.on("routeChangeComplete", handleRouteChange);
        return () => router.events.off("routeChangeComplete", handleRouteChange);
    }, [router.events]);

    if (!GA_MEASUREMENT_ID) return null;

    return (
        <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />

            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', '${GA_MEASUREMENT_ID}', {
                            send_page_view: false,
                            cookie_domain: 'auto',
                        });

                        gtag('event', 'page_view', {
                            page_path: window.location.pathname,
                            page_location: window.location.href,
                            page_title: document.title,
                        });
                    `,
                }}
            />
        </>
    );
};

export default GoogleAnalytics;
