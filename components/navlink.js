import {useRouter} from 'next/router';
import Link from 'next/link';
import { useEffect } from 'react';

const Navlink = ({href, children}) => {
    const {asPath} = useRouter();

    // Determine if this is the stories link
    const isStoriesLink = href === '/stories';

    let className = asPath === href ? 'active' : '';

    return (
        <Link
            href={href}
            prefetch={isStoriesLink} // Prefetch the stories page
        >
            <button className={className}>
                {children}
            </button>
        </Link>
    );
};

export default Navlink;
