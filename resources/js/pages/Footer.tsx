import Logo from '../../images/sog-logo.png';
export default function Footer() {
    return (
        <footer className="px-4 sm:px-6 md:px-6 lg:px-8 py-12 md:py-16 bg-primary">
            <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
                <div>
                    <div>
                        <img
                            src={Logo}
                            alt="SOG Logo"
                            className="mb-5 h-12 w-auto"
                        />
                    </div>
                    <p
                        className="max-w-[200px] text-sm leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        Crafted with precision. Built to last. Designed to
                        impress. SOG does it all.
                    </p>
                </div>
                {[
                    {
                        heading: 'Services',
                        links: [
                            'Sliding Doors',
                            'Swing Doors',
                            'Aluminum Windows',
                            'Glass Partitions',
                            'Cabinets & Racks',
                        ],
                    },
                    {
                        heading: 'Company',
                        links: [
                            'About Us',
                            'Projects',
                            'AR Preview',
                            'Free Inspection',
                        ],
                    },
                    {
                        heading: 'Contact',
                        links: [
                            'Facebook Page',
                            'Messenger',
                            'Viber',
                            'Email Us',
                        ],
                    },
                ].map((col, i) => (
                    <div key={i}>
                        <h4
                            className="mb-4 text-[10px] font-black tracking-widest uppercase"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                            {col.heading}
                        </h4>
                        <div className="space-y-2.5">
                            {col.links.map((link, j) => (
                                <a
                                    key={j}
                                    href="#"
                                    className="block text-sm transition-colors hover:text-[#9eb4c9]"
                                    style={{
                                        color: 'rgba(255,255,255,0.5)',
                                    }}
                                >
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div
                className="mx-auto mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 pt-6 max-w-7xl px-4 sm:px-8 md:px-12 lg:px-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
                <span
                    className="text-xs text-center md:text-left"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                    © 2026 SOG Glass & Aluminum Services. All rights reserved.
                </span>
                <span
                    className="text-xs"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                    Made in the Philippines 🇵🇭
                </span>
            </div>
        </footer>
    );
}
