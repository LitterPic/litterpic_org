import { useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import { GA_MEASUREMENT_ID } from "../lib/ga";

const GoogleAnalytics = () => {
    const router = useRouter();

    useEffect(() => {
        const handleRouteChange = (url) => {
            if (typeof window.gtag === "function") {
                window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
            }
        };

        router.events.on("routeChangeComplete", handleRouteChange);
        return () => router.events.off("routeChangeComplete", handleRouteChange);
    }, [router.events]);

    if (!GA_MEASUREMENT_ID) return null;

    return (
        <>
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
                        gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
                    `,
                }}
            />
        </>
    );
};

export default GoogleAnalytics;
