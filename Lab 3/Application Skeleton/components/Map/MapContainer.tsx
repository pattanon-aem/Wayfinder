'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useEffect, useState, ReactNode } from 'react';
import mapStyles from '@/info/Styling.json';

interface MapContainerProps {
    children?: ReactNode;
    onLocationChange?: (location: { lat: number; lng: number }) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
}

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 };
const DEFAULT_ZOOM = 11;
const USER_LOCATION_ZOOM = 15;

export default function MapContainer({
    children,
    onLocationChange,
    center,
    zoom
}: MapContainerProps) {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    useEffect(() => {
        // Request user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    console.log('MapContainer: User location obtained:', location);
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

    console.log('MapContainer render - Center:', mapCenter, 'Zoom:', mapZoom, 'User location:', userLocation);

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
                        position: 7 // RIGHT_TOP
                    }}
                    clickableIcons={false}
                >
                    {/* User Location Marker */}
                    {userLocation && (
                        <AdvancedMarker position={userLocation}>
                            <div className="relative">
                                {/* Glowing effect */}
                                <div className="absolute inset-0 rounded-full bg-[#00ff84] blur-xs"></div>
                                {/* Center dot */}
                                <div className="relative w-4 h-4 rounded-full bg-[#00ff84] shadow-sm shadow-[#00ff84]"></div>
                            </div>
                        </AdvancedMarker>
                    )}
                    {children}
                </Map>
            </div>
        </APIProvider>
    );
}
