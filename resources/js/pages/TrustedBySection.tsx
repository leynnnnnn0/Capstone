export default function TrustedBySection() {
    const companies = [
        'blend',
        'bitpanda',
        'hippo',
        'Cerebral',
        'blend',
        'cameo',
        'bitpanda',
    ];
    return (
        <section className="w-full bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-6xl text-center">
                <h2 className="mb-8 text-lg font-medium text-gray-600 md:text-xl">
                    Trusted by leading companies worldwide
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {companies.map((company, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-4 shadow-sm transition hover:shadow-md"
                        >
                            <span className="text-sm font-semibold text-gray-700 capitalize md:text-base">
                                {company}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
