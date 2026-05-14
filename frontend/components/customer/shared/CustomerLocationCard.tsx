"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, MapPin, Navigation, Route } from "lucide-react";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ORIGIN = "SOG Glass and Aluminum, Prinza St, General Trias, Cavite";

type CustomerLocationCardProps = {
  address: string;
  addressLat?: string | null;
  addressLng?: string | null;
  compact?: boolean;
};

type RouteInfo = {
  distance: string;
  duration: string;
};

type GoogleDirectionsResult = {
  routes: Array<{
    legs: Array<{
      distance?: { text: string };
      duration?: { text: string };
    }>;
  }>;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps: {
      DirectionsService: new () => {
        route: (request: unknown) => Promise<GoogleDirectionsResult>;
      };
      TravelMode: {
        DRIVING: string;
      };
    };
  };
};

function loadGoogleMapsScript() {
  return new Promise<void>((resolve, reject) => {
    const googleWindow = window as GoogleMapsWindow;

    if (!MAPS_API_KEY) return reject(new Error("Missing Google Maps API key."));
    if (googleWindow.google?.maps) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      const poll = window.setInterval(() => {
        if (googleWindow.google?.maps) {
          window.clearInterval(poll);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });
}

export default function CustomerLocationCard({
  address,
  addressLat,
  addressLng,
  compact = false,
}: CustomerLocationCardProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const hasPinnedLocation = Boolean(addressLat && addressLng);

  const mapsEmbedUrl = useMemo(() => {
    if (!hasPinnedLocation || !MAPS_API_KEY) return null;

    return `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${encodeURIComponent(
      ORIGIN,
    )}&destination=${addressLat},${addressLng}&mode=driving`;
  }, [addressLat, addressLng, hasPinnedLocation]);

  const mapsDirectionsUrl = useMemo(() => {
    if (!hasPinnedLocation) return null;

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      ORIGIN,
    )}&destination=${addressLat},${addressLng}&travelmode=driving`;
  }, [addressLat, addressLng, hasPinnedLocation]);

  useEffect(() => {
    if (!hasPinnedLocation || !MAPS_API_KEY) return;

    let mounted = true;

    async function fetchRoute() {
      setRouteLoading(true);
      setRouteError(null);

      try {
        await loadGoogleMapsScript();
        const googleMaps = (window as GoogleMapsWindow).google?.maps;
        if (!googleMaps) return;

        const directionsService = new googleMaps.DirectionsService();
        const result = await directionsService.route({
          origin: ORIGIN,
          destination: {
            lat: Number(addressLat),
            lng: Number(addressLng),
          },
          travelMode: googleMaps.TravelMode.DRIVING,
        });
        const leg = result.routes[0]?.legs[0];

        if (mounted && leg) {
          setRouteInfo({
            distance: leg.distance?.text ?? "",
            duration: leg.duration?.text ?? "",
          });
        }
      } catch {
        if (mounted) setRouteError("Route details are unavailable right now.");
      } finally {
        if (mounted) setRouteLoading(false);
      }
    }

    fetchRoute();

    return () => {
      mounted = false;
    };
  }, [addressLat, addressLng, hasPinnedLocation]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className={compact ? "px-4 pb-3 pt-4" : "px-5 pb-4 pt-5"}>
        <h2 className={compact ? "mb-3 text-xs font-black uppercase tracking-widest text-primary" : "mb-4 text-sm font-black uppercase tracking-widest text-primary"}>
          Customer Location
        </h2>
        <div className="flex items-start gap-3">
          <MapPin className={compact ? "mt-0.5 size-4 shrink-0 text-primary" : "mt-0.5 size-5 shrink-0 text-primary"} />
          <p className={compact ? "text-sm font-semibold leading-relaxed text-slate-950" : "text-base font-semibold leading-relaxed text-slate-950"}>{address}</p>
        </div>

        {routeLoading && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="size-3 animate-spin" />
            Calculating route...
          </div>
        )}
        {routeError && <p className="mt-3 text-xs font-semibold text-red-600">{routeError}</p>}
        {routeInfo && !routeLoading && (
          <div className={compact ? "mt-3 flex flex-wrap items-center gap-2" : "mt-4 flex flex-wrap items-center gap-3"}>
            <span className={compact ? "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary" : "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary"}>
              <Route className={compact ? "size-3.5" : "size-4"} />
              {routeInfo.distance}
            </span>
            <span className={compact ? "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500" : "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-500"}>
              <Clock className={compact ? "size-3.5" : "size-4"} />
              {routeInfo.duration} (fastest)
            </span>
          </div>
        )}

        {mapsDirectionsUrl && (
          <a
            href={mapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={compact ? "mt-3 inline-flex items-center gap-2 text-xs font-black text-primary hover:underline" : "mt-4 inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"}
          >
            <Navigation className={compact ? "size-3.5" : "size-4"} />
            Get Directions
          </a>
        )}
      </div>

      {mapsEmbedUrl ? (
        <div className={compact ? "relative h-[260px] w-full bg-slate-100 sm:h-[300px]" : "relative h-[360px] w-full bg-slate-100 sm:h-[420px]"}>
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          )}
          <iframe
            src={mapsEmbedUrl}
            title="Customer location map"
            className="h-full w-full border-0"
            onLoad={() => setMapLoaded(true)}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-slate-50 px-5 text-center text-sm font-semibold text-slate-500">
          Map is available after the customer pins a valid location.
        </div>
      )}
    </div>
  );
}
