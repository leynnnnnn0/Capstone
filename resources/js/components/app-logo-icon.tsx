import type { SVGAttributes } from 'react';
import Logo from '../../images/sog-logo.png';
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <img src={Logo} alt='Application Logo' className='size-16'/>
    );
}
