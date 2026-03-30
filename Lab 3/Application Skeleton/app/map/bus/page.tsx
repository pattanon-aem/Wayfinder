'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import BusStopInfo from '@/components/Map/BusStopInfo';
import MapSidebar from '@/components/Map/MapSidebar';
import RoutingPanel from '@/components/Map/RoutingPanel';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { calculateDistance, NEARBY_RADIUS_KM } from '@/lib/utils/mapUtils';
import { getRoute, type RoutingMode, type RoutePoint } from '@/lib/utils/oneMapApi';
import { MdDirections, MdClose } from 'react-icons/md';

interface BusStop {
    BusStopCode: string;
    RoadName: string;
    Description: string;
    Latitude: number;
    Longitude: number;
}

export default function BusMapPage() {
    const [busStops, setBusStops] = useState<BusStop[]>([]);
    const [selectedBusStop, setSelectedBusStop] = useState<BusStop | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showRoutingPanel, setShowRoutingPanel] = useState(false);
    const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; mode: RoutingMode; destination: string } | null>(null);

    useEffect(() => {
        fetch('/api/transport/bus-stops')
            .then(res => res.json())
            .then(data => {
                setBusStops(data.value || []);
            })
            .catch(console.error);
    }, []);

    const filteredBusStops = searchQuery
        ? busStops.filter(
            (stop) =>
                stop.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stop.BusStopCode.includes(searchQuery) ||
                stop.RoadName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : busStops;

    // Filter by radius if user location is available
    // When no location, show a reasonable number of stops (limit to prevent rendering thousands)
    let nearbyBusStops = userLocation
        ? filteredBusStops.filter(stop => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude);
            return distance <= NEARBY_RADIUS_KM;
        })
        : filteredBusStops.slice(0, 200); // Show first 200 stops when no location yet

    // If location is available but no stops found within radius, show closest 50 stops
    if (userLocation && nearbyBusStops.length === 0) {
        const stopsWithDistance = filteredBusStops.map(stop => ({
            ...stop,
            distance: calculateDistance(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude)
        })).sort((a, b) => a.distance - b.distance);
        nearbyBusStops = stopsWithDistance.slice(0, 50);
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
    }; const clearRoute = () => {
        setRoutePath([]);
        setRouteInfo(null);
    };

    return (
        <div className="w-full h-screen flex">
            {/* Sidebar */}
            <MapSidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                backHref="/map"
                title="🚌 Search Bus Stops"
                routes={nearbyBusStops.slice(0, 50).map(stop => ({
                    number: stop.BusStopCode,
                    subtitle: stop.Description,
                    time: stop.RoadName
                }))}
                onRouteClick={(route) => {
                    const stop = nearbyBusStops.find(s => s.BusStopCode === route.number);
                    if (stop) setSelectedBusStop(stop);
                }}
            />

            <div className="flex-1 relative">
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

                    {/* Bus Stop Markers - only within 1km */}
                    {nearbyBusStops.slice(0, 200).map((stop) => (
                        <AdvancedMarker
                            key={stop.BusStopCode}
                            position={{ lat: stop.Latitude, lng: stop.Longitude }}
                            onClick={() => setSelectedBusStop(stop)}
                        >
                            <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                🚌
                            </div>
                        </AdvancedMarker>
                    ))}

                    {/* Info Window */}
                    {selectedBusStop && (
                        <InfoWindow
                            position={{ lat: selectedBusStop.Latitude, lng: selectedBusStop.Longitude }}
                            onCloseClick={() => setSelectedBusStop(null)}
                        >
                            <BusStopInfo
                                busStopCode={selectedBusStop.BusStopCode}
                                busStopName={selectedBusStop.Description}
                                roadName={selectedBusStop.RoadName}
                                onClose={() => setSelectedBusStop(null)}
                            />
                        </InfoWindow>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
