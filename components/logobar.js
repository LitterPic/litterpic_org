import {useRouter} from 'next/router';
import React, {useState} from 'react';

const Logobar = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleNavigation = (route) => {
        router.push(route);
        setIsOpen(false);
    }

    return (
        <div className="logo-bar">
            <div className="logo-bar-left-content">
                <div className="logo-content">
                    <img src="/images/litter_pic_logo.png" alt="LitterPic logo" width={100} height={100}
                         onClick={() => router.push('/')}/>
                </div>
                <div className="text-content">
                    <p className="logo">LitterPic</p>
                    <p className="tagline">Inspire Change</p>
                </div>
            </div>
        </div>
    );
};

export default Logobar;
