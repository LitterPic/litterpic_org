import Document, {Head, Html, Main, NextScript} from 'next/document';
import React from "react";

class MyDocument extends Document {
    render() {
        return (
            <Html lang="eng">
                <Head>
                    <script async src="https://www.googletagmanager.com/gtag/js?id=G-64THCF0R4S"></script>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                                    window.dataLayer = window.dataLayer || [];
                                                    function gtag(){dataLayer.push(arguments);}
                                                    gtag('js', new Date());
                                                    gtag('config', 'G-64THCF0R4S');
              `
                        }}
                    />
                    <meta charSet="utf-8"/>
                    <meta name="theme-color" content="#015e41"/>
                    <link rel="icon" href="/public/favicon.ico"/>
                    {/*<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE"/>*/}
                </Head>
                <body>
                <Main/>
                <NextScript/>
                </body>
            </Html>
        );
    }
}

export default MyDocument;
