import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import LocationPicker from './LocationPicker';
import DatePicker from './appointment/components/date-picker';


type ClientErrors = Partial<Record<string, string>>;

export default function Booking() {
    function nowTimeStr() {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate() + (nowTimeStr() > '17:00' ? 1 : 0)).padStart(2, '0')}`;
    }


     


    const [clientErrors, setClientErrors] = useState<ClientErrors>({});

   const validate = (): boolean => {
       const e: ClientErrors = {};

       const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
       // allows letters, accents, spaces, hyphens, apostrophes

       const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

       // First Name
       if (!data.first_name.trim()) {
           e.first_name = 'First name is required.';
       } else if (!nameRegex.test(data.first_name.trim())) {
           e.first_name =
               'First name must be 2–50 characters and contain only letters.';
       }

       // Last Name
       if (!data.last_name.trim()) {
           e.last_name = 'Last name is required.';
       } else if (!nameRegex.test(data.last_name.trim())) {
           e.last_name =
               'Last name must be 2–50 characters and contain only letters.';
       }

       // Phone Number
       if (!data.phone_number.trim()) {
           e.phone_number = 'Phone number is required.';
       } else if (!/^[0-9+\s\-]{10,15}$/.test(data.phone_number.trim())) {
           e.phone_number =
               'Enter a valid phone number (10–15 digits, numbers only).';
       }

       // Email (now required + stricter)
       if (!data.email.trim()) {
           e.email = 'Email is required.';
       } else if (!emailRegex.test(data.email.trim())) {
           e.email = 'Enter a valid email address (e.g. name@example.com).';
       }

       // Preferred Date
       if (!data.preferred_date) {
           e.preferred_date = 'Preferred date is required.';
       } else if (
           new Date(data.preferred_date) < new Date(new Date().toDateString())
       ) {
           e.preferred_date = 'Date cannot be in the past.';
       }

       // Preferred Time
       if (!data.preferred_time) {
           e.preferred_time = 'Preferred time is required.';
       }

       if (!data.address) {
           e.address = 'Address is required';
       }

       // Consent
       if (!data.consent) {
           e.consent = 'You must agree to be contacted.';
       }

       setClientErrors(e);
       return Object.keys(e).length === 0;
   };

    // Clear a specific client error as the user fixes it
    const clearError = (field: string) => {
        if (clientErrors[field]) {
            setClientErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Stop here if client validation fails — rate limit never touched
        if (!validate()) return;

        post('/appointments', {
            preserveScroll: true,
            onSuccess: () => { alert('Appointment booked successfully!'); reset(); },
            onError: (e) => {
                  alert('Failed to book appointment. Please try again.');
            }
              
        });
    };

    // Merge server errors with client errors — server always wins
    const fieldError = (field: string) =>
        errors[field as keyof typeof errors] || clientErrors[field];


    const [timeOptions, setTimeOptions] = useState([
        'Morning (8–12 AM)',
        'Afternoon (1–5 PM)',
    ]);

        const { data, setData, post, processing, errors, reset } = useForm({
            first_name: '',
            last_name: '',
            phone_number: '',
            email: '',
            address: '',
            address_pinned: '',
            address_lat: '',
            address_lng: '',
            preferred_date: todayStr(),
            preferred_time: 'Afternoon (1–5 PM)',
            service_type: 'quotation',
            service_type_other: '',
            additional_notes: '',
            consent: false,
        });



    useEffect(() => {
        if (data.preferred_date != todayStr() || nowTimeStr() < '12:00') {
            setTimeOptions(['Morning (8–12 AM)', 'Afternoon (1–5 PM)']);
        } else {
            setTimeOptions(['Afternoon (1–5 PM)']);
            setData('preferred_time', 'Afternoon (1–5 PM)');
        }
    }, [data.preferred_date])
    


    return (
        <section
            id="booking"
            className="mx-auto max-w-7xl px-4 py-4 sm:px-8 md:px-12 md:py-8 lg:px-20 lg:py-12"
        >
            <div className="items-center">
                <div className="grid items-start gap-10 md:grid-cols-2 md:gap-20">
                    {/* Left: Info — unchanged */}
                    <div>
                        <span className="text-[10px] font-black tracking-widest text-[#2c5282] uppercase">
                            Book a Home Visit
                        </span>
                        <h2 className="mt-3 mb-5 text-5xl leading-[1.05] font-bold tracking-tight text-secondary">
                            Free Ocular
                            <br />
                            Visit.
                        </h2>
                        <p className="mb-8 max-w-sm text-base leading-relaxed text-slate-500">
                            Our certified technicians visit your home, measure
                            precisely, and provide a detailed no-obligation
                            quotation — completely free of charge.
                        </p>
                        <ul className="mb-10 space-y-3 text-sm text-slate-600">
                            {[
                                'Precise on-site measurement of all openings',
                                'Product recommendation tailored to your space',
                                'Material samples to see and feel in person',
                                'Transparent itemized quote on the spot',
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className="font-black text-[#2c5282]">
                                        ✦
                                    </span>{' '}
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-start gap-4 rounded-2xl bg-secondary p-5 text-white">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl">
                                📲
                            </div>
                            <div>
                                <h4 className="mb-1 text-lg font-bold">
                                    Get an instant Quote first
                                </h4>
                                <p className="mb-2 text-sm leading-relaxed">
                                    Just input the heigth and width of the
                                    product that you want and get a quote
                                    instantly.
                                </p>
                                <Link
                                    href="/get-quote"
                                    className="cursor-pointer text-xs font-black underline"
                                >
                                    Get Started →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 sm:p-10 shadow-xl">
                        <h3 className="mb-7 text-lg font-bold text-slate-900">
                            Schedule a Visit
                        </h3>

                        {/* Rate limit banner */}
                        {errors.rate_limit && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                                {errors.rate_limit}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="first_name">
                                        First Name
                                    </Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => {
                                            setData(
                                                'first_name',
                                                e.target.value,
                                            );
                                            clearError('first_name');
                                        }}
                                        placeholder="Juan"
                                    />
                                    {fieldError('first_name') && (
                                        <span className="text-xs text-red-500">
                                            {fieldError('first_name')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) => {
                                            setData(
                                                'last_name',
                                                e.target.value,
                                            );
                                            clearError('last_name');
                                        }}
                                        placeholder="dela Cruz"
                                    />
                                    {fieldError('last_name') && (
                                        <span className="text-xs text-red-500">
                                            {fieldError('last_name')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone_number">
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone_number"
                                    value={data.phone_number}
                                    onChange={(e) => {
                                        setData('phone_number', e.target.value);
                                        clearError('phone_number');
                                    }}
                                    type="tel"
                                    placeholder="+63 9XX XXX XXXX"
                                />
                                {fieldError('phone_number') && (
                                    <span className="text-xs text-red-500">
                                        {fieldError('phone_number')}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setData('email', e.target.value);
                                        clearError('email');
                                    }}
                                    type="email"
                                    placeholder="juan@example.com"
                                />
                                {fieldError('email') && (
                                    <span className="text-xs text-red-500">
                                        {fieldError('email')}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Home Address</Label>
                                <LocationPicker
                                    onLocationChange={({
                                        address,
                                        pinned,
                                        lat,
                                        lng,
                                    }) => {
                                        setData((prev) => ({
                                            ...prev,
                                            address: address,
                                            address_pinned: pinned,
                                            address_lat: lat.toFixed(6),
                                            address_lng: lng.toFixed(6),
                                        }));
                                    }}
                                    error={errors.address}
                                />
                                {fieldError('address') && (
                                    <span className="text-xs text-red-500">
                                        {fieldError('address')}
                                    </span>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="preferred_date">
                                        Preferred Date
                                    </Label>

                                    <DatePicker
                                        id="preferred_date"
                                        min={todayStr()}
                                        value={data.preferred_date}
                                        onChange={(e) => {
                                            setData(
                                                'preferred_date',
                                                e.target.value,
                                            );
                                        }}
                                    />
                                    {fieldError('preferred_date') && (
                                        <span className="text-xs text-red-500">
                                            {fieldError('preferred_date')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Preferred Time</Label>
                                    <Select
                                        value={data.preferred_time}
                                        onValueChange={(value) => {
                                            setData('preferred_time', value);
                                            clearError('preferred_time');
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeOptions.map((item, i) => (
                                                <SelectItem
                                                    key={i}
                                                    value={item}
                                                >
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldError('preferred_time') && (
                                        <span className="text-xs text-red-500">
                                            {fieldError('preferred_time')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="additional_notes">
                                    Additional Notes
                                </Label>
                                <Textarea
                                    id="additional_notes"
                                    value={data.additional_notes}
                                    onChange={(e) =>
                                        setData(
                                            'additional_notes',
                                            e.target.value,
                                        )
                                    }
                                    rows={2}
                                    placeholder="Tell us what you need…"
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="consent"
                                        checked={data.consent}
                                        onCheckedChange={(checked) => {
                                            setData(
                                                'consent',
                                                checked as boolean,
                                            );
                                            clearError('consent');
                                        }}
                                    />
                                    <label
                                        htmlFor="consent"
                                        className="cursor-pointer text-xs leading-relaxed text-slate-500"
                                    >
                                        I agree to be contacted via call, SMS,
                                        or email by SOG Glass & Aluminum
                                        regarding my appointment request and
                                        related services.
                                    </label>
                                </div>
                                {fieldError('consent') && (
                                    <span className="text-xs text-red-500">
                                        {fieldError('consent')}
                                    </span>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing || !data.consent}
                                className="mt-2 w-full bg-[#2c5282] py-3.5 text-sm font-bold hover:bg-[#6a8fa8] disabled:opacity-60"
                            >
                                {processing
                                    ? 'Booking...'
                                    : 'Book Free Inspection'}
                            </Button>

                            <p className="text-center text-xs text-slate-400">
                                No payment required · Cancel anytime
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
