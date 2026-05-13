import { MapPin, Loader2, Navigation, Clock, Route } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const ORIGIN = 'SOG Glass and Aluminum, Prinza St, General Trias, Cavite';
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

interface RouteInfo {
    distance: string;
    duration: string;
    steps: { instruction: string; distance: string }[];
}

function loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.maps) return resolve();
        if (document.getElementById('google-maps-script')) {
            // Script already loading — wait for it
            const poll = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(poll);
                    resolve();
                }
            }, 100);
            return;
        }
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
    });
}

export default function LocationCard({ appointment }: any) {
    const [mapLoaded, setMapLoaded] = useState(false);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    const mapsEmbedUrl =
        appointment.address_lat && appointment.address_lng
            ? `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${encodeURIComponent(ORIGIN)}&destination=${appointment.address_lat},${appointment.address_lng}&mode=driving`
            : null;

    const mapsDirectionsUrl =
        appointment.address_lat && appointment.address_lng
            ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ORIGIN)}&destination=${appointment.address_lat},${appointment.address_lng}&travelmode=driving`
            : null;

    useEffect(() => {
        if (
            !appointment.address_lat ||
            !appointment.address_lng ||
            !MAPS_API_KEY
        )
            return;

        const fetchRoute = async () => {
            setRouteLoading(true);
            setRouteError(null);
            try {
                await loadGoogleMapsScript();

                const directionsService =
                    new window.google.maps.DirectionsService();
                const result = await directionsService.route({
                    origin: ORIGIN,
                    destination: {
                        lat: parseFloat(appointment.address_lat),
                        lng: parseFloat(appointment.address_lng),
                    },
                    travelMode: window.google.maps.TravelMode.DRIVING,
                });

                const leg = result.routes[0].legs[0];
                const steps = leg.steps.map((step: any) => ({
                    instruction: step.instructions.replace(/<[^>]+>/g, ''),
                    distance: step.distance?.text ?? '',
                }));

                setRouteInfo({
                    distance: leg.distance?.text ?? '',
                    duration: leg.duration?.text ?? '',
                    steps,
                });
            } catch (e: any) {
                setRouteError('Could not calculate route.');
            } finally {
                setRouteLoading(false);
            }
        };

        fetchRoute();
    }, [appointment.address_lat, appointment.address_lng]);

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="px-6 pt-6 pb-4">
                <h2 className="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">
                    Customer Location
                </h2>
                <div className="flex items-start gap-3">
                    <MapPin
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                    />
                    <p className="text-sm font-medium text-foreground">
                        {appointment.address}
                    </p>
                </div>

                {/* Distance & Duration */}
                {routeLoading && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" />
                        Calculating route...
                    </div>
                )}
                {routeError && (
                    <p className="mt-3 text-xs text-destructive">
                        {routeError}
                    </p>
                )}
                {routeInfo && !routeLoading && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <Route size={11} />
                            {routeInfo.distance}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            <Clock size={11} />
                            {routeInfo.duration} (fastest)
                        </span>
                    </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    {mapsDirectionsUrl && (
                        <a
                            href={mapsDirectionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                            <Navigation size={12} /> Get Directions
                        </a>
                    )}
                </div>
            </div>

            {mapsEmbedUrl ? (
                <div className="relative h-96 w-full bg-muted">
                    {!mapLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2
                                size={20}
                                className="animate-spin text-muted-foreground"
                            />
                        </div>
                    )}
                    <iframe
                        src={mapsEmbedUrl}
                        className="h-full w-full border-0"
                        onLoad={() => setMapLoaded(true)}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>
            ) : (
                <div className="flex h-32 items-center justify-center bg-muted text-xs text-muted-foreground">
                    No location pinned
                </div>
            )}
        </div>
    );
}
