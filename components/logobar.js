import {useRouter} from 'next/router';
import React from 'react';

const Logobar = () => {
    const router = useRouter();
    return (
        <div className="logo-bar">
            <div className="logo-bar-left-content">
                <div className="logo-content">
                    <img src="/images/litter_pic_logo.png" alt="LitterPic logo" width={100} height={100}
                         onClick={() => router.push('/')}/>
                    <div className="logo-text">
                        <p className="logo">LitterPic</p>
                        <p className="tagline">Inspire Change</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Logobar;
