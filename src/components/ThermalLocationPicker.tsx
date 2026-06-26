"use client";

import { useEffect, useRef, useState } from "react";

type MapPosition = { lat(): number; lng(): number };
type MapInstance = { setCenter(position: MapPosition): void; setZoom(zoom: number): void; addListener(name: string, callback: (event: { latLng?: MapPosition }) => void): void };
type MarkerInstance = { setPosition(position: MapPosition): void; getPosition(): MapPosition | null; addListener(name: string, callback: () => void): void };
type AutocompleteInstance = { addListener(name: string, callback: () => void): void; getPlace(): { geometry?: { location?: MapPosition } } };
type GoogleMapsApi = {
  maps: {
    Map: new (node: HTMLElement, options: { center: { lat: number; lng: number }; zoom: number; mapTypeId: string }) => MapInstance;
    Marker: new (options: { map: MapInstance; position: { lat: number; lng: number }; draggable: boolean }) => MarkerInstance;
    places: { Autocomplete: new (input: HTMLInputElement) => AutocompleteInstance };
  };
};

declare global { interface Window { google?: GoogleMapsApi } }

export function ThermalLocationPicker() {
  const mapNode = useRef<HTMLDivElement>(null);
  const searchNode = useRef<HTMLInputElement>(null);
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapNode.current || !searchNode.current) return;
    const initialize = () => {
      if (!window.google || !mapNode.current || !searchNode.current) return;
      const center = { lat: 23.8103, lng: 90.4125 };
      const map = new window.google.maps.Map(mapNode.current, { center, zoom: 7, mapTypeId: "satellite" });
      const marker = new window.google.maps.Marker({ map, position: center, draggable: true });
      const autocomplete = new window.google.maps.places.Autocomplete(searchNode.current);
      const update = (position: MapPosition) => setCoordinates({ lat: String(position.lat()), lng: String(position.lng()) });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        map.setCenter(place.geometry.location); map.setZoom(16); marker.setPosition(place.geometry.location); update(place.geometry.location);
      });
      map.addListener("click", (event) => { if (event.latLng) { marker.setPosition(event.latLng); update(event.latLng); } });
      marker.addListener("dragend", () => { const position = marker.getPosition(); if (position) update(position); });
    };
    if (window.google) initialize();
    else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true; script.onload = initialize; document.head.appendChild(script);
    }
  }, [apiKey]);

  return <div className="wide location-picker">
    <label className="field"><span>Project location / Google Maps place</span><input ref={searchNode} name="projectLocation" placeholder="Search location or enter it manually" required /></label>
    {apiKey ? <div ref={mapNode} className="thermal-map" /> : <p className="map-fallback">Google Maps is not configured. Enter the project location manually; coordinates are optional.</p>}
    <div className="form-grid"><label className="field"><span>Latitude</span><input name="latitude" value={coordinates.lat} onChange={(event) => setCoordinates((value) => ({ ...value, lat: event.target.value }))} /></label><label className="field"><span>Longitude</span><input name="longitude" value={coordinates.lng} onChange={(event) => setCoordinates((value) => ({ ...value, lng: event.target.value }))} /></label></div>
  </div>;
}
