"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type LocationValue = {
  address: string;
  pinned: string;
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  onLocationChange: (location: LocationValue) => void;
  error?: string;
};

type GoogleWindow = Window &
  typeof globalThis & {
    google?: {
      maps: GoogleMapsApi;
    };
  };

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GooglePlace = {
  formatted_address?: string;
  geometry?: {
    location: GoogleLatLng;
  };
  name?: string;
};

type GoogleGeocodeResult = {
  formatted_address: string;
  types: string[];
};

type GoogleMapsApi = {
  Animation: {
    DROP: unknown;
  };
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => {
    addListener: (eventName: string, callback: (event: { latLng?: GoogleLatLng }) => void) => void;
    panTo: (latLng: GoogleLatLng) => void;
    setZoom: (zoom: number) => void;
  };
  Marker: new (options: Record<string, unknown>) => {
    addListener: (eventName: string, callback: () => void) => void;
    getPosition: () => GoogleLatLng | null;
    setPosition: (latLng: GoogleLatLng) => void;
  };
  Geocoder: new () => {
    geocode: (
      request: { location: GoogleLatLng },
      callback: (results: GoogleGeocodeResult[], status: string) => void,
    ) => void;
  };
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      options: Record<string, unknown>,
    ) => {
      addListener: (eventName: string, callback: () => void) => void;
      getPlace: () => GooglePlace;
    };
  };
};

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const googleWindow = window as GoogleWindow;

    if (!mapsApiKey) {
      reject(new Error("Missing Google Maps API key."));
      return;
    }

    if (googleWindow.google?.maps) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places,geocoding`;
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
  const [pinned, setPinned] = useState<LocationValue | null>(null);
  const [loading, setLoading] = useState(Boolean(mapsApiKey));
  const [loadError, setLoadError] = useState(!mapsApiKey);

  const updateManualAddress = (event: ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    const location = {
      address,
      pinned: pinned?.pinned ?? address,
      lat: pinned?.lat ?? 0,
      lng: pinned?.lng ?? 0,
    };

    setPinned(address ? location : null);
    onLocationChange(location);
  };

  useEffect(() => {
    if (!mapsApiKey) return;

    let mounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!mounted || !mapRef.current || !searchRef.current) return;

        const googleMaps = (window as GoogleWindow).google?.maps;
        if (!googleMaps) return;
        const defaultCenter = { lat: 14.5995, lng: 120.9842 };
        const map = new googleMaps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });
        const marker = new googleMaps.Marker({
          position: defaultCenter,
          map,
          draggable: true,
          animation: googleMaps.Animation.DROP,
        });
        const geocoder = new googleMaps.Geocoder();

        const reverseGeocode = (latLng: GoogleLatLng) => {
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status !== "OK" || !results?.[0]) return;

            const lat = latLng.lat();
            const lng = latLng.lng();
            const usableResult =
              results.find((result) => !result.types.includes("plus_code")) ??
              results[0];
            const address = usableResult.formatted_address;

            if (searchRef.current && searchRef.current.value === "") {
              searchRef.current.value = address;
            }

            const location = {
              address: searchRef.current?.value || address,
              pinned: address,
              lat,
              lng,
            };
            setPinned(location);
            onLocationChange(location);
          });
        };

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos) reverseGeocode(pos);
        });

        map.addListener("click", (event) => {
          if (!event.latLng) return;
          marker.setPosition(event.latLng);
          reverseGeocode(event.latLng);
        });

        const autocomplete = new googleMaps.places.Autocomplete(
          searchRef.current,
          {
            componentRestrictions: { country: "ph" },
            fields: ["formatted_address", "geometry", "name", "types"],
          },
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address ?? "";
          const pinnedLabel = place.name ?? address.split(",")[0];

          map.panTo(place.geometry.location);
          map.setZoom(16);
          marker.setPosition(place.geometry.location);

          const location = { address, pinned: pinnedLabel, lat, lng };
          setPinned(location);
          onLocationChange(location);
        });

        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [onLocationChange]);

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        error ? "border-red-400" : "border-slate-200"
      }`}
    >
      <div className="border-b border-slate-200 px-3 py-2">
        <input
          ref={searchRef}
          type="text"
          placeholder="Enter your address..."
          className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          onChange={updateManualAddress}
        />
      </div>

      <div
        ref={mapRef}
        className={`h-56 w-full ${loading || loadError ? "hidden" : "block"}`}
      />

      {loading && (
        <div className="flex h-56 items-center justify-center bg-slate-50 text-sm text-slate-400">
          Loading map...
        </div>
      )}

      {loadError && (
        <div className="flex h-24 items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-400">
          Type your address above. Map pinning is available when
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured.
        </div>
      )}

      {pinned ? (
        <div className="divide-y divide-slate-200 border-t border-slate-200 bg-slate-50">
          <div className="px-3 py-2">
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
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
              Drag the pin, click the map, or search to set your address.
            </p>
          </div>
        )
      )}
    </div>
  );
}
