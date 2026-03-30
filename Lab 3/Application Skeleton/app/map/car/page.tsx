'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import CarparkInfo from '@/components/Map/CarparkInfo';
import TrafficAlertInfo from '@/components/Map/TrafficAlertInfo';
import MapSidebar from '@/components/Map/MapSidebar';
import RoutingPanel from '@/components/Map/RoutingPanel';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { calculateDistance, NEARBY_RADIUS_KM } from '@/lib/utils/mapUtils';
import { getRoute, type RoutingMode, type RoutePoint } from '@/lib/utils/oneMapApi';
import { MdDirections, MdClose } from 'react-icons/md';

interface Carpark {
    CarParkID: string;
    Location: string;
    Development: string;
    AvailableLots: number;
    Latitude?: number;
    Longitude?: number;
}

interface TrafficIncident {
    Type: string;
    Latitude: number;
    Longitude: number;
    Message: string;
}

interface RoadWork {
    EventID: string;
    StartDate: string;
    EndDate: string;
    Location: string;
    Message: string;
    Latitude: number;
    Longitude: number;
}

export default function CarMapPage() {
    const [carparks, setCarparks] = useState<Carpark[]>([]);
    const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
    const [roadworks, setRoadworks] = useState<RoadWork[]>([]);
    const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
    const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
    const [selectedRoadwork, setSelectedRoadwork] = useState<RoadWork | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showRoutingPanel, setShowRoutingPanel] = useState(false);
    const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; mode: RoutingMode; destination: string } | null>(null);
    const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
    const [erpCharges, setErpCharges] = useState<number | null>(null);

    useEffect(() => {
        fetchAllData();

        // Refresh data every minute
        const interval = setInterval(fetchAllData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchAllData = async () => {
        try {
            const carparkRes = await fetch('/api/transport/carpark-availability');
            const carparkData = await carparkRes.json();
            const parsedCarparks = (carparkData.value || []).map((cp: any) => {
                const coords = cp.Location?.trim().split(/\s+/);
                const lat = coords && coords[0] ? parseFloat(coords[0]) : undefined;
                const lng = coords && coords[1] ? parseFloat(coords[1]) : undefined;
                return {
                    ...cp,
                    Latitude: lat && !isNaN(lat) ? lat : undefined,
                    Longitude: lng && !isNaN(lng) ? lng : undefined,
                };
            });

            const validCarparks = parsedCarparks.filter((cp: any) =>
                cp.Latitude !== undefined && cp.Longitude !== undefined
            );

            setCarparks(validCarparks);

            const incidentRes = await fetch('/api/transport/traffic-incidents');
            const incidentData = await incidentRes.json();
            const validIncidents = (incidentData.value || []).filter((incident: any) => {
                const lat = parseFloat(incident.Latitude);
                const lng = parseFloat(incident.Longitude);
                return !isNaN(lat) && !isNaN(lng);
            }).map((incident: any) => ({
                ...incident,
                Latitude: parseFloat(incident.Latitude),
                Longitude: parseFloat(incident.Longitude)
            }));
            setTrafficIncidents(validIncidents);

            const roadworkRes = await fetch('/api/transport/roadworks');
            const roadworkData = await roadworkRes.json();
            const validRoadworks = (roadworkData.value || []).filter((roadwork: any) => {
                const lat = parseFloat(roadwork.Latitude);
                const lng = parseFloat(roadwork.Longitude);
                return !isNaN(lat) && !isNaN(lng);
            }).map((roadwork: any) => ({
                ...roadwork,
                Latitude: parseFloat(roadwork.Latitude),
                Longitude: parseFloat(roadwork.Longitude)
            }));
            setRoadworks(validRoadworks);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const filteredCarparks = searchQuery
        ? carparks.filter(
            (cp) =>
                cp.Development?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cp.Location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cp.CarParkID.includes(searchQuery)
        )
        : carparks;

    let nearbyCarparks = userLocation
        ? filteredCarparks.filter(carpark => {
            if (!carpark.Latitude || !carpark.Longitude) return false;
            const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                carpark.Latitude,
                carpark.Longitude
            );
            return distance <= NEARBY_RADIUS_KM;
        })
        : filteredCarparks.slice(0, 100);

    if (userLocation && nearbyCarparks.length === 0) {
        const carparksWithDistance = filteredCarparks
            .filter(cp => cp.Latitude && cp.Longitude)
            .map(carpark => ({
                ...carpark,
                distance: calculateDistance(userLocation.lat, userLocation.lng, carpark.Latitude!, carpark.Longitude!)
            }))
            .sort((a, b) => a.distance - b.distance);
        nearbyCarparks = carparksWithDistance.slice(0, 50);
    }

    const nearbyTrafficIncidents = userLocation
        ? trafficIncidents.filter(incident => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, incident.Latitude, incident.Longitude);
            return distance <= NEARBY_RADIUS_KM;
        })
        : trafficIncidents.slice(0, 50); // Show first 50 when no location

    const nearbyRoadworks = userLocation
        ? roadworks.filter(roadwork => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, roadwork.Latitude, roadwork.Longitude);
            return distance <= NEARBY_RADIUS_KM;
        })
        : roadworks.slice(0, 50); // Show first 50 when no location

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
        <div className="w-full bg-amber-500 h-screen flex relative">
            {/* Sidebar */}
            <MapSidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                backHref="/map"
                title="🚗 Search Carparks"
                routes={nearbyCarparks.slice(0, 50).map(carpark => ({
                    number: carpark.CarParkID,
                    subtitle: carpark.Development,
                    time: `${carpark.AvailableLots}`
                }))}
                onRouteClick={(route) => {
                    const carpark = nearbyCarparks.find(cp => cp.CarParkID === route.number);
                    if (carpark) setSelectedCarpark(carpark);
                }}
            />

            <div className="flex w-full h-full relative">
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

                    {/* Carpark Markers - only within radius */}
                    {nearbyCarparks.slice(0, 100).map((carpark, index) => {
                        // Only render if we have valid coordinates
                        if (!carpark.Latitude || !carpark.Longitude ||
                            isNaN(carpark.Latitude) || isNaN(carpark.Longitude) ||
                            typeof carpark.Latitude !== 'number' || typeof carpark.Longitude !== 'number') {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`carpark-${carpark.CarParkID}-${index}`}
                                position={{ lat: Number(carpark.Latitude), lng: Number(carpark.Longitude) }}
                                onClick={() => setSelectedCarpark(carpark)}
                            >
                                <div className="bg-green-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    🅿️
                                </div>
                            </AdvancedMarker>
                        );
                    })}

                    {/* Traffic Incident Markers - only within radius */}
                    {nearbyTrafficIncidents.map((incident, index) => {
                        // Additional safety check
                        if (!incident.Latitude || !incident.Longitude ||
                            isNaN(incident.Latitude) || isNaN(incident.Longitude)) {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`incident-${index}`}
                                position={{ lat: Number(incident.Latitude), lng: Number(incident.Longitude) }}
                                onClick={() => setSelectedIncident(incident)}
                            >
                                <div className="bg-red-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    ⚠️
                                </div>
                            </AdvancedMarker>
                        );
                    })}

                    {/* Roadwork Markers - only within radius */}
                    {nearbyRoadworks.map((roadwork, index) => {
                        // Additional safety check
                        if (!roadwork.Latitude || !roadwork.Longitude ||
                            isNaN(roadwork.Latitude) || isNaN(roadwork.Longitude)) {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`roadwork-${roadwork.EventID}-${index}`}
                                position={{ lat: Number(roadwork.Latitude), lng: Number(roadwork.Longitude) }}
                                onClick={() => setSelectedRoadwork(roadwork)}
                            >
                                <div className="bg-yellow-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    🚧
                                </div>
                            </AdvancedMarker>
                        );
                    })}                    {/* Info Windows */}
                    {selectedCarpark && selectedCarpark.Latitude && selectedCarpark.Longitude &&
                        !isNaN(selectedCarpark.Latitude) && !isNaN(selectedCarpark.Longitude) && (
                            <InfoWindow
                                position={{ lat: Number(selectedCarpark.Latitude), lng: Number(selectedCarpark.Longitude) }}
                                onCloseClick={() => setSelectedCarpark(null)}
                            >
                                <CarparkInfo
                                    carparkId={selectedCarpark.CarParkID}
                                    onClose={() => setSelectedCarpark(null)}
                                />
                            </InfoWindow>
                        )}

                    {selectedIncident && selectedIncident.Latitude && selectedIncident.Longitude &&
                        !isNaN(selectedIncident.Latitude) && !isNaN(selectedIncident.Longitude) && (
                            <InfoWindow
                                position={{ lat: Number(selectedIncident.Latitude), lng: Number(selectedIncident.Longitude) }}
                                onCloseClick={() => setSelectedIncident(null)}
                            >
                                <TrafficAlertInfo
                                    type={selectedIncident.Type}
                                    message={selectedIncident.Message}
                                    onClose={() => setSelectedIncident(null)}
                                    onRefresh={fetchAllData}
                                />
                            </InfoWindow>
                        )}

                    {selectedRoadwork && selectedRoadwork.Latitude && selectedRoadwork.Longitude &&
                        !isNaN(selectedRoadwork.Latitude) && !isNaN(selectedRoadwork.Longitude) && (
                            <InfoWindow
                                position={{ lat: Number(selectedRoadwork.Latitude), lng: Number(selectedRoadwork.Longitude) }}
                                onCloseClick={() => setSelectedRoadwork(null)}
                            >
                                <TrafficAlertInfo
                                    type="Roadwork"
                                    message={`${selectedRoadwork.Location}: ${selectedRoadwork.Message}`}
                                    onClose={() => setSelectedRoadwork(null)}
                                    onRefresh={fetchAllData}
                                />
                            </InfoWindow>
                        )}
                </MapContainer>
            </div>
        </div>
    );
}
