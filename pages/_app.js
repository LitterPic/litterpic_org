import React from "react";
import Layout from "../components/layout";
import {library} from '@fortawesome/fontawesome-svg-core';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';
import '../styles/styles.scss'

library.add(faEye, faEyeSlash);

const MyApp = ({Component, pageProps}) => {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
};

export default MyApp;
