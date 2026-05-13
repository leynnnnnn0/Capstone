import { useEffect, useRef, useState } from 'react';

interface LocationPickerProps {
    onLocationChange: (location: {
        address: string;
        pinned: string;
        lat: number;
        lng: number;
    }) => void;
    error?: string;
}

interface PinnedLocation {
    address: string;
    pinned: string;
    lat: number;
    lng: number;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

function loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.maps) {
            resolve();
            return;
        }

        const existing = document.getElementById('google-maps-script');
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geocoding`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export default function LocationPicker({
    onLocationChange,
    error,
}: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [pinned, setPinned] = useState<PinnedLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => {
                if (!mapRef.current || !searchRef.current) return;

                console.log(searchRef.current);

                const defaultCenter = { lat: 14.5995, lng: 120.9842 };

                const map = new window.google.maps.Map(mapRef.current, {
                    center: defaultCenter,
                    zoom: 13,
                    disableDefaultUI: true,
                    zoomControl: true,
                });

                const marker = new window.google.maps.Marker({
                    position: defaultCenter,
                    map,
                    draggable: true,
                    animation: window.google.maps.Animation.DROP,
                });

                const geocoder = new window.google.maps.Geocoder();

                const reverseGeocode = (latLng: google.maps.LatLng) => {
                    geocoder.geocode(
                        { location: latLng },
                        (results, status) => {
                            if (status === 'OK' && results?.[0]) {
                                const lat = latLng.lat();
                                const lng = latLng.lng();

                                const usableResult =
                                    results.find(
                                        (r) => !r.types.includes('plus_code'),
                                    ) ?? results[0];

                                const address = usableResult.formatted_address;

                                // ✅ Only auto-populate the search field if it's blank
                                if (
                                    searchRef.current &&
                                    searchRef.current.value === ''
                                ) {
                                    searchRef.current.value = address;
                                }

                                const location = {
                                    address: searchRef.current!.value,
                                    pinned: address,
                                    lat,
                                    lng,
                                };
                                setPinned(location);
                                onLocationChange(location);
                            }
                        },
                    );
                };

                marker.addListener('dragend', () => {
                    const pos = marker.getPosition();
                    if (pos) reverseGeocode(pos);
                });

                map.addListener('click', (e: google.maps.MapMouseEvent) => {
                    if (e.latLng) {
                        marker.setPosition(e.latLng);
                        reverseGeocode(e.latLng);
                    }
                });

                const autocomplete = new window.google.maps.places.Autocomplete(
                    searchRef.current!,
                    {
                        componentRestrictions: { country: 'ph' },
                        fields: [
                            'formatted_address',
                            'geometry',
                            'name',
                            'types',
                        ],
                    },
                );

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry?.location) return;

                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const address = place.formatted_address ?? '';

                    // For searched places, use the place name as the pinned label
                    const pinned = place.name ?? address.split(',')[0];

                    map.panTo(place.geometry.location);
                    map.setZoom(16);
                    marker.setPosition(place.geometry.location);

                    const location = { address, pinned, lat, lng };
                    setPinned(location);
                    onLocationChange(location);
                });

                setLoading(false);
            })
            .catch(() => {
                setLoadError(true);
                setLoading(false);
            });
    }, []);

    return (
        <div
            className={`overflow-hidden rounded-xl border ${error ? 'border-red-400' : 'border-slate-200'}`}
        >
            {/* Search input */}
            <div className="border-b border-slate-200 px-3 py-2">
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Enter your address..."
                    className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
            </div>

            {/* Map */}
            <div
                ref={mapRef}
                className={`h-56 w-full ${loading || loadError ? 'hidden' : 'block'}`}
            />

            {/* Loading state */}
            {loading && (
                <div className="flex h-56 items-center justify-center bg-slate-50 text-sm text-slate-400">
                    Loading map…
                </div>
            )}

            {/* Error state */}
            {loadError && (
                <div className="flex h-56 items-center justify-center bg-red-50 text-sm text-red-400">
                    Failed to load map. Check your API key.
                </div>
            )}

            {/* Pinned location info */}
            {pinned ? (
                <div className="divide-y divide-slate-200 border-t border-slate-200 bg-slate-50">
                    {/* Pinned label */}
                    <div className="px-3 py-2">
                        <p className="mb-0.5 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                            Pinned Location
                        </p>
                        <p className="text-[13px] font-medium text-slate-800">
                            {pinned.pinned}
                        </p>
                    </div>
                  
                </div>
            ) : (
                !loading &&
                !loadError && (
                    <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[13px] text-slate-400">
                            Drag the pin, click the map, or search to set your
                            address.
                        </p>
                    </div>
                )
            )}
        </div>
    );
}
