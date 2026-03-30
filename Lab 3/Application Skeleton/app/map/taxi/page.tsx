'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import MapSidebar from '@/components/Map/MapSidebar';
import RoutingPanel from '@/components/Map/RoutingPanel';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { calculateDistance, NEARBY_RADIUS_KM } from '@/lib/utils/mapUtils';
import { getRoute, type RoutingMode, type RoutePoint } from '@/lib/utils/oneMapApi';
import { MdDirections, MdClose } from 'react-icons/md';
import Image from 'next/image';

interface Taxi {
    Latitude: number;
    Longitude: number;
    rotation?: number;
}

interface TaxiStand {
    TaxiCode: string;
    Latitude: number;
    Longitude: number;
    Name: string;
}

export default function TaxiMapPage() {
    const [taxis, setTaxis] = useState<Taxi[]>([]);
    const [taxiStands, setTaxiStands] = useState<TaxiStand[]>([]);
    const [selectedStand, setSelectedStand] = useState<TaxiStand | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRoutingPanel, setShowRoutingPanel] = useState(false);
    const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; mode: RoutingMode; destination: string } | null>(null);

    useEffect(() => {
        fetchTaxiData();
        fetchTaxiStands();

        // Refresh taxi data every 30 seconds
        const interval = setInterval(fetchTaxiData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchTaxiData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/transport/taxi-availability');
            const data = await response.json();
            // Filter out taxis with invalid coordinates and assign random rotation
            const validTaxis = (data.value || []).filter((taxi: any) => {
                const lat = parseFloat(taxi.Latitude);
                const lng = parseFloat(taxi.Longitude);
                return !isNaN(lat) && !isNaN(lng) && typeof lat === 'number' && typeof lng === 'number';
            }).map((taxi: any) => ({
                Latitude: parseFloat(taxi.Latitude),
                Longitude: parseFloat(taxi.Longitude),
                rotation: Math.floor(Math.random() * 8) * 45 // 0, 45, 90, 135, 180, 225, 270, 315 degrees
            }));

            setTaxis(validTaxis);
        } catch (error) {
            console.error('Error fetching taxis:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTaxiStands = async () => {
        try {
            const response = await fetch('/api/transport/taxi-stands');
            const data = await response.json();
            // Filter out taxi stands with invalid coordinates
            const validStands = (data.value || []).filter((stand: any) => {
                const lat = parseFloat(stand.Latitude);
                const lng = parseFloat(stand.Longitude);
                return !isNaN(lat) && !isNaN(lng) && typeof lat === 'number' && typeof lng === 'number';
            }).map((stand: any) => ({
                ...stand,
                Latitude: parseFloat(stand.Latitude),
                Longitude: parseFloat(stand.Longitude)
            }));
            setTaxiStands(validStands);
        } catch (error) {
            console.error('Error fetching taxi stands:', error);
        }
    };

    let nearbyTaxiStands = userLocation
        ? taxiStands.filter(stand => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, stand.Latitude, stand.Longitude);
            return distance <= NEARBY_RADIUS_KM;
        })
        : taxiStands.slice(0, 50); // Show first 50 stands when no location

    // If location is available but no stands found within radius, show closest 30
    if (userLocation && nearbyTaxiStands.length === 0) {
        const standsWithDistance = taxiStands.map(stand => ({
            ...stand,
            distance: calculateDistance(userLocation.lat, userLocation.lng, stand.Latitude, stand.Longitude)
        })).sort((a, b) => a.distance - b.distance);
        nearbyTaxiStands = standsWithDistance.slice(0, 30);
    }

    let nearbyTaxis = userLocation
        ? taxis.filter(taxi => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, taxi.Latitude, taxi.Longitude);
            return distance <= NEARBY_RADIUS_KM;
        })
        : taxis.slice(0, 100);

    if (userLocation && nearbyTaxis.length === 0) {
        const taxisWithDistance = taxis.map(taxi => ({
            ...taxi,
            distance: calculateDistance(userLocation.lat, userLocation.lng, taxi.Latitude, taxi.Longitude)
        })).sort((a, b) => a.distance - b.distance);
        nearbyTaxis = taxisWithDistance.slice(0, 50);
    }

    const handleRouteRequest = async (destination: { lat: number; lng: number }, mode: RoutingMode, destinationName: string) => {
        if (!userLocation) return;

        const route = await getRoute(userLocation, destination, mode);

        if (route && route.route.length > 0) {
            setRoutePath(route.route);
            setRouteInfo({
                distance: route.distance,
                duration: route.duration,
                mode,
                destination: destinationName,
            });
        } else {
            // Show error - no route found
            alert(`No ${mode} route found to ${destinationName}. Try a different travel mode.`);
        }
    };

    const clearRoute = () => {
        setRoutePath([]);
        setRouteInfo(null);
    };

    return (
        <div className="w-full h-screen flex">
            {/* Sidebar */}
            <MapSidebar
                searchQuery=""
                onSearchChange={() => { }}
                backHref="/map"
                title="🚕 Taxi Stands"
                routes={nearbyTaxiStands.slice(0, 50).map(stand => ({
                    number: stand.TaxiCode,
                    subtitle: stand.Name,
                    time: `${nearbyTaxis.length}`
                }))}
                onRouteClick={(route) => {
                    const stand = nearbyTaxiStands.find(s => s.TaxiCode === route.number);
                    if (stand) setSelectedStand(stand);
                }}
            />

            {/* Map Container */}
            <div className="flex-1 relative">
                {/* Floating Routing Button */}
                {!showRoutingPanel && (
                    <button
                        onClick={() => setShowRoutingPanel(true)}
                        className="absolute top-4 left-4 z-10 bg-[#121212] py-3 px-4 rounded-full shadow-lg flex items-center gap-2 font-semibold"
                    >
                        <MdDirections className="text-xl" />
                        <span>Directions</span>
                    </button>
                )}

                {/* Routing Panel */}
                {showRoutingPanel && (
                    <div className="absolute top-4 left-4 z-10 w-96">
                        <RoutingPanel
                            userLocation={userLocation}
                            onRouteRequest={handleRouteRequest}
                            onClose={() => setShowRoutingPanel(false)}
                        />
                    </div>
                )}

                {/* Route Info Display */}
                {routeInfo && (
                    <div className="absolute top-4 right-4 z-10 bg-[#141414] border border-[#212121] rounded-lg p-4 shadow-xl max-w-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h4 className="text-[#e7e7e7] font-semibold">Route to {routeInfo.destination}</h4>
                                <p className="text-[#7d7d7d] text-sm capitalize">{routeInfo.mode}</p>
                            </div>
                            <button
                                onClick={clearRoute}
                                className="text-[#7d7d7d] hover:text-[#e7e7e7]"
                            >
                                <MdClose className="text-xl" />
                            </button>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div>
                                <p className="text-[#7d7d7d]">Distance</p>
                                <p className="text-[#e7e7e7] font-semibold">
                                    {(routeInfo.distance / 1000).toFixed(2)} km
                                </p>
                            </div>
                            <div>
                                <p className="text-[#7d7d7d]">Duration</p>
                                <p className="text-[#e7e7e7] font-semibold">
                                    {Math.round(routeInfo.duration / 60)} min
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <MapContainer onLocationChange={setUserLocation}>
                    {/* Route Polyline */}
                    {routePath.length > 0 && (
                        <RoutePolyline
                            path={routePath.map(p => ({ lat: p.lat, lng: p.lng }))}
                        />
                    )}

                    {/* Taxi Markers - only within radius */}
                    {nearbyTaxis.slice(0, 100).map((taxi, index) => {
                        // Additional safety check
                        if (!taxi.Latitude || !taxi.Longitude ||
                            isNaN(taxi.Latitude) || isNaN(taxi.Longitude)) {
                            return null;
                        }

                        return (
                            <AdvancedMarker
                                key={`taxi-${index}`}
                                position={{ lat: Number(taxi.Latitude), lng: Number(taxi.Longitude) }}
                            >
                                <div className="transition-transform duration-700 ease-in-out"
                                    style={{
                                        transform: `rotate(${taxi.rotation || 0}deg)`
                                    }}
                                >
                                    <Image
                                        src="/taxi.png"
                                        alt="Taxi"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                            </AdvancedMarker>
                        );
                    })}                    {/* Taxi Stand Markers - only within radius, clickable with info window */}
                    {nearbyTaxiStands.map((stand, index) => {
                        // Additional safety check
                        if (!stand.Latitude || !stand.Longitude ||
                            isNaN(stand.Latitude) || isNaN(stand.Longitude)) {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`stand-${stand.TaxiCode}-${index}`}
                                position={{ lat: Number(stand.Latitude), lng: Number(stand.Longitude) }}
                                onClick={() => setSelectedStand(stand)}
                            >
                                <div className="bg-yellow-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    🅿️
                                </div>
                            </AdvancedMarker>
                        );
                    })}

                    {/* Info Window for selected taxi stand */}
                    {selectedStand && (
                        <InfoWindow
                            position={{ lat: Number(selectedStand.Latitude), lng: Number(selectedStand.Longitude) }}
                            onCloseClick={() => setSelectedStand(null)}
                        >
                            <div className="p-2">
                                <h3 className="font-semibold text-sm mb-1 text-[#e7e7e7]">{selectedStand.Name}</h3>
                                <p className="text-xs text-[#7d7d7d]">Code: {selectedStand.TaxiCode}</p>
                            </div>
                        </InfoWindow>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
