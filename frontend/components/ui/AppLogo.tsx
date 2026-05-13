'use client';

import Logo from '@/public/images/logo.png';
import Image from 'next/image';
import Link from 'next/link';

export default function AppLogo() {
    return (
      <Link href="/" className="cursor-pointer">
        <span className="text-sm text-center font-bold">
          <Image src="/images/sog-logo.png"
            width={50}
            height={50}
                alt="SOG Logo"/>
        </span>
      </Link>
    );
}