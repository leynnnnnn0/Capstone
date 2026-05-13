import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Logo from '../../images/sog-logo.png';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { url } = usePage();

    const isActive = (path) => url.startsWith(path);
    const home = url === '/';

    const navLinkClass = (path) =>
        `relative transition-colors hover:text-slate-800 ${
            isActive(path) ? 'text-slate-900' : 'text-slate-500'
        }`;

    const ActiveIndicator = () => (
        <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-primary"></span>
    );

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Desktop Navbar */}
                <div className="hidden grid-cols-3 items-center py-4 md:grid">
                    {/* Left: Nav Links */}
                    <div className="flex items-center gap-8 text-[11px] font-bold tracking-widest uppercase">
                        <Link href="/" className={navLinkClass('/')}>
                            Home
                            {home && <ActiveIndicator />}
                        </Link>

                        <Link
                            href="/products"
                            className={navLinkClass('/products')}
                        >
                            Products
                            {isActive('/products') && <ActiveIndicator />}
                        </Link>

                        <Link
                            href="/get-quote"
                            className={navLinkClass('/get-quote')}
                        >
                            Quote
                            {isActive('/get-quote') && <ActiveIndicator />}
                        </Link>

                        <Link href="/track" className={navLinkClass('/track')}>
                            Track
                            {isActive('/track') && <ActiveIndicator />}
                        </Link>
                    </div>

                    {/* Center: Logo */}
                    <div className="flex items-center justify-center">
                        <Link href="/">
                            <img
                                src={Logo}
                                alt="SOG Logo"
                                className="h-12 w-auto"
                            />
                        </Link>
                    </div>

                    {/* Right: Contact Button */}
                    <div className="flex items-center justify-end">
                        <a
                            href="/login"
                            className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-[11px] font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#6a8fa8]"
                        >
                            Login
                        </a>
                    </div>
                </div>

                {/* Mobile Navbar */}
                <div className="flex items-center justify-between py-3 md:hidden">
                    {/* Logo */}
                    <Link href="/">
                        <img
                            src={Logo}
                            alt="SOG Logo"
                            className="h-10 w-auto"
                        />
                    </Link>

                    {/* Hamburger */}
                    <button
                        className="flex items-center justify-center rounded p-2 focus:ring-2 focus:ring-slate-400 focus:outline-none"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="h-7 w-7 text-slate-700"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            {menuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="border-b border-slate-100 bg-white/95 shadow-sm md:hidden">
                    <div className="flex flex-col items-center gap-4 py-4 text-[11px] font-bold tracking-widest uppercase">
                        <Link
                            href="/"
                            className={navLinkClass('/')}
                            onClick={() => setMenuOpen(false)}
                        >
                            Home
                            {home && <ActiveIndicator />}
                        </Link>

                        <Link
                            href="/products"
                            className={navLinkClass('/products')}
                            onClick={() => setMenuOpen(false)}
                        >
                            Products
                            {isActive('/products') && <ActiveIndicator />}
                        </Link>

                        <Link
                            href="/get-quote"
                            className={navLinkClass('/get-quote')}
                            onClick={() => setMenuOpen(false)}
                        >
                            Get Quote
                            {isActive('/get-quote') && <ActiveIndicator />}
                        </Link>

                        <Link href="/track" className={navLinkClass('/track')}>
                            Track
                            {isActive('/track') && <ActiveIndicator />}
                        </Link>

                        <a
                            href="#booking"
                            className="cursor-pointer rounded-xl bg-[#2c5282] px-6 py-2.5 text-[11px] font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#6a8fa8]"
                            onClick={() => setMenuOpen(false)}
                        >
                            Contact Us
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
