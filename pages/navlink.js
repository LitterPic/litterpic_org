import {useRouter} from 'next/router';
import Link from 'next/link';

const Navlink = ({href, children}) => {
    const {asPath} = useRouter();

    let className = asPath === href ? 'active' : '';

    return (
        <Link href={href}>
            <button className={className}>
                {children}
            </button>
        </Link>
    );
};

export default Navlink;
