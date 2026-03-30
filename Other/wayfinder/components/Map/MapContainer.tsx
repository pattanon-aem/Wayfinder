'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useEffect, useState, ReactNode } from 'react';
import mapStyles from '@/info/Styling.json';

interface MapContainerProps {
    children?: ReactNode;
    onLocationChange?: (location: { lat: number; lng: number }) => void;
    onZoomChange?: (zoom: number) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
}

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 };
const DEFAULT_ZOOM = 11;
const USER_LOCATION_ZOOM = 15;

export default function MapContainer({
    children,
    onLocationChange,
    onZoomChange,
    center,
    zoom
}: MapContainerProps) {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [currentZoom, setCurrentZoom] = useState<number>(zoom || DEFAULT_ZOOM);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(location);
                    setLocationPermission('granted');
                    onLocationChange?.(location);
                },
                (error) => {
                    console.error('MapContainer: Error getting location:', error);
                    setLocationPermission('denied');
                }
            );
        }
    }, []);

    const mapCenter = center || userLocation || SINGAPORE_CENTER;
    const mapZoom = zoom || (userLocation ? USER_LOCATION_ZOOM : DEFAULT_ZOOM);

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <div className="w-full h-full">
                <Map
                    defaultCenter={mapCenter}
                    defaultZoom={mapZoom}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                    mapTypeControl={false}
                    fullscreenControl={true}
                    streetViewControl={false}
                    zoomControl={true}
                    fullscreenControlOptions={{
                        position: 7
                    }}
                    clickableIcons={false}
                    onZoomChanged={(e) => {
                        const map = e.map;
                        const newZoom = map.getZoom();
                        if (newZoom !== undefined && newZoom !== currentZoom) {
                            setCurrentZoom(newZoom);
                            onZoomChange?.(newZoom);
                        }
                    }}
                >
                    {userLocation && (
                        <AdvancedMarker position={userLocation}>
                            <div className="relative">

                                <div className="relative w-4 h-4 rounded-full bg-[#ffffff] shadow-md shadow-black border"></div>
                            </div>
                        </AdvancedMarker>
                    )}
                    {children}
                </Map>
            </div>
        </APIProvider>
    );
}
