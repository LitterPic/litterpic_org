import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Logobar = () => {
    return (
        <div className="logo-bar">
            <div className="logo-content">
                <Link href="/">
                    <div className="logo-link">
                        <Image src="/images/LitterPicLogo.png" alt="LitterPic logo" width={100} height={100}/>
                    </div>
                </Link>
            </div>
            <div className="text-content">
                <p className="logo">LitterPic</p>
                <p className="tagline">Inspire Change</p>
            </div>
        </div>
    );
};

export default Logobar;
