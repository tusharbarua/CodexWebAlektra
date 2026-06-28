"use client";

import { useEffect, useRef, useState } from "react";

type MapPosition = { lat(): number; lng(): number };
type PlaceResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: { location?: MapPosition };
};
type AutocompleteInstance = { addListener(name: string, callback: () => void): void; getPlace(): PlaceResult };
type GoogleMapsApi = {
  maps: {
    places: {
      Autocomplete: new (input: HTMLInputElement, options?: { fields?: string[] }) => AutocompleteInstance;
    };
  };
};

declare global { interface Window { google?: GoogleMapsApi } }

type SelectedPlace = {
  googlePlaceId: string;
  projectLocationName: string;
  projectFormattedAddress: string;
  latitude: string;
  longitude: string;
};

export function ThermalLocationPicker() {
  const searchNode = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [manualMode, setManualMode] = useState(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const [googleReady, setGoogleReady] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !searchNode.current || manualMode) return;
    const initialize = () => {
      if (!window.google || !searchNode.current) {
        setManualMode(true);
        return;
      }
      setGoogleReady(true);
      const autocomplete = new window.google.maps.places.Autocomplete(searchNode.current, {
        fields: ["place_id", "name", "formatted_address", "geometry.location"]
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;
        if (!place.place_id || !location) {
          setSelected(null);
          return;
        }
        const next = {
          googlePlaceId: place.place_id,
          projectLocationName: place.name ?? "",
          projectFormattedAddress: place.formatted_address ?? place.name ?? "",
          latitude: String(location.lat()),
          longitude: String(location.lng())
        };
        setSelected(next);
        setTypedValue(next.projectFormattedAddress);
      });
    };
    if (window.google) initialize();
    else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-google-places='true']");
      if (existing) {
        existing.addEventListener("load", initialize, { once: true });
        existing.addEventListener("error", () => setManualMode(true), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googlePlaces = "true";
      script.onload = initialize;
      script.onerror = () => setManualMode(true);
      document.head.appendChild(script);
    }
  }, [apiKey, manualMode]);

  return <div className="wide location-picker">
    {!manualMode ? (
      <>
        <label className="thermal-field"><span>Project location</span><input
          ref={searchNode}
          name="projectLocation"
          value={typedValue}
          onChange={(event) => {
            setTypedValue(event.target.value);
            setSelected(null);
          }}
          placeholder={googleReady ? "Search and select a Google Places suggestion" : "Loading Google Places..."}
          required
        /></label>
        <input type="hidden" name="locationMode" value="google" />
        <input type="hidden" name="googlePlaceId" value={selected?.googlePlaceId ?? ""} />
        <input type="hidden" name="projectLocationName" value={selected?.projectLocationName ?? ""} />
        <input type="hidden" name="projectFormattedAddress" value={selected?.projectFormattedAddress ?? ""} />
        <input type="hidden" name="latitude" value={selected?.latitude ?? ""} />
        <input type="hidden" name="longitude" value={selected?.longitude ?? ""} />
        <input type="hidden" name="manualAddressFallback" value="" />
        {selected ? <p className="map-fallback selected-location">Selected location: {selected.projectFormattedAddress}</p> : <p className="map-fallback">Select a suggested Google place. No map is displayed.</p>}
        <button type="button" className="thermal-secondary-button" onClick={() => setManualMode(true)}>Enter address manually</button>
      </>
    ) : (
      <>
        <input type="hidden" name="locationMode" value="manual" />
        <input type="hidden" name="googlePlaceId" value="" />
        <input type="hidden" name="projectLocationName" value="" />
        <input type="hidden" name="projectFormattedAddress" value="" />
        <input type="hidden" name="latitude" value="" />
        <input type="hidden" name="longitude" value="" />
        <label className="thermal-field"><span>Project location / manual address</span><input name="projectLocation" placeholder="Enter project address manually" required /></label>
        <label className="thermal-field"><span>Manual location details</span><textarea name="manualAddressFallback" rows={3} placeholder="Add any directions, rooftop name, or site access detail" /></label>
        <p className="map-fallback">Google Places is not configured or unavailable. Manual location submission is allowed; distance can be calculated later after coordinates are added.</p>
      </>
    )}
  </div>;
}

