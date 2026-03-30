'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import BusStopInfo from '@/components/Map/BusStopInfo';
import CarparkInfo from '@/components/Map/CarparkInfo';
import TrafficAlertInfo from '@/components/Map/TrafficAlertInfo';
import DestinationSearch from '@/components/Map/DestinationSearch';
import Link from 'next/link';
import { calculateDistance, NEARBY_RADIUS_KM } from '@/lib/utils/mapUtils';
import Image from 'next/image';
import { IoSearchOutline } from 'react-icons/io5';

interface BusStop {
    BusStopCode: string;
    RoadName: string;
    Description: string;
    Latitude: number;
    Longitude: number;
}

interface Carpark {
    CarParkID: string;
    Location: string;
    Development: string;
    Latitude?: number;
    Longitude?: number;
}

interface Taxi {
    Latitude: number;
    Longitude: number;
    rotation?: number;
}

interface TrafficIncident {
    Type: string;
    Latitude: number;
    Longitude: number;
    Message: string;
}

export default function MapPage() {
    const [busStops, setBusStops] = useState<BusStop[]>([]);
    const [carparks, setCarparks] = useState<Carpark[]>([]);
    const [taxis, setTaxis] = useState<Taxi[]>([]);
    const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
    const [selectedBusStop, setSelectedBusStop] = useState<BusStop | null>(null);
    const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
    const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        // Fetch bus stops
        fetch('/api/transport/bus-stops')
            .then(res => res.json())
            .then(data => setBusStops(data.value || []))
            .catch(console.error);

        // Fetch carparks
        fetch('/api/transport/carpark-availability')
            .then(res => res.json())
            .then(data => {
                // Parse carpark coordinates
                const parsedCarparks = (data.value || []).map((cp: any) => {
                    const coords = cp.Location?.trim().split(/\s+/);
                    const lat = coords && coords[0] ? parseFloat(coords[0]) : undefined;
                    const lng = coords && coords[1] ? parseFloat(coords[1]) : undefined;
                    return {
                        ...cp,
                        Latitude: lat && !isNaN(lat) ? lat : undefined,
                        Longitude: lng && !isNaN(lng) ? lng : undefined,
                    };
                });
                setCarparks(parsedCarparks);
            })
            .catch(console.error);

        // Fetch taxis
        const fetchTaxis = () => {
            fetch('/api/transport/taxi-availability')
                .then(res => res.json())
                .then(data => {
                    const validTaxis = (data.value || []).filter((taxi: any) => {
                        const lat = parseFloat(taxi.Latitude);
                        const lng = parseFloat(taxi.Longitude);
                        return !isNaN(lat) && !isNaN(lng);
                    }).map((taxi: any) => ({
                        Latitude: parseFloat(taxi.Latitude),
                        Longitude: parseFloat(taxi.Longitude),
                        rotation: Math.floor(Math.random() * 8) * 45 // 0, 45, 90, 135, 180, 225, 270, 315 degrees
                    }));
                    setTaxis(validTaxis);
                })
                .catch(console.error);
        };

        fetchTaxis();
        // Refresh taxi data every 30 seconds
        const taxiInterval = setInterval(fetchTaxis, 30000);

        // Fetch traffic incidents
        fetch('/api/transport/traffic-incidents')
            .then(res => res.json())
            .then(data => {
                const validIncidents = (data.value || []).filter((incident: any) => {
                    const lat = parseFloat(incident.Latitude);
                    const lng = parseFloat(incident.Longitude);
                    return !isNaN(lat) && !isNaN(lng);
                }).map((incident: any) => ({
                    ...incident,
                    Latitude: parseFloat(incident.Latitude),
                    Longitude: parseFloat(incident.Longitude)
                }));
                setTrafficIncidents(validIncidents);
            })
            .catch(console.error);

        return () => clearInterval(taxiInterval);
    }, []);

    // Search for location
    const searchLocation = async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        try {
            const response = await fetch(`/api/search/location?searchVal=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data.results || []);
            setShowResults(true);
        } catch (error) {
            console.error('Error searching location:', error);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchLocation(value);
    };

    const handleDestinationSelect = (destination: any) => {
        setSearchQuery(destination.SEARCHVAL);
        setShowResults(false);
        // You can add routing logic here if needed
    };

    const handleRouteSelect = (option: any, destination: any) => {
        // Navigate to specific view based on mode
        const modeMap: Record<string, string> = {
            bus: '/map/bus',
            taxi: '/map/taxi',
            car: '/map/car',
        };

        if (modeMap[option.mode]) {
            window.location.href = `${modeMap[option.mode]}?dest=${encodeURIComponent(destination.SEARCHVAL)}`;
        }
    };

    return (
        <div className="w-full h-screen flex">
            {/* Sidebar */}
            <div className="relative w-full max-w-[416px] h-full bg-black">
                {/* Search Bar & Title */}
                <div className="absolute left-5 top-[19px] right-5 z-20">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search destination..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                            className="w-full h-[50px] bg-[#121212] border border-[#383838] rounded-[29px] pl-6 pr-12 text-white text-base focus:outline-none focus:border-emerald-400/50 transition-colors"
                        />
                        <IoSearchOutline className="absolute right-6 top-1/2 -translate-y-1/2 w-[22px] h-6 text-[#7d7d7d]" />

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-[#141414] border border-[#212121] rounded-lg shadow-xl max-h-[300px] overflow-y-auto z-30">
                                {searchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleDestinationSelect(result)}
                                        className="w-full text-left p-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#212121] last:border-b-0"
                                    >
                                        <p className="text-sm text-[#e7e7e7] font-light">{result.SEARCHVAL}</p>
                                        <p className="text-xs text-[#7d7d7d] font-light mt-0.5">{result.ADDRESS}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="absolute top-[91px] left-5 right-5 bottom-0 overflow-y-auto">
                    {/* Destination Search - Removed, now integrated above */}

                    {/* View Mode Selection */}
                    <div className="space-y-3 mb-4">
                        <Link
                            href="/map/bus"
                            className="group block w-full bg-[#141414] border border-[#212121] rounded-lg hover:border-emerald-400/50 transition-all duration-300 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg text-[#e7e7e7] font-light group-hover:text-emerald-400 transition-colors">Bus Routes</p>
                                    <p className="text-xs text-[#7d7d7d] font-light mt-0.5">View public transport</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center group-hover:bg-emerald-400/10 transition-colors">
                                    <svg className="w-4 h-4 text-[#7d7d7d] group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                        <Link
                            href="/map/taxi"
                            className="group block w-full bg-[#141414] border border-[#212121] rounded-lg hover:border-emerald-400/50 transition-all duration-300 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg text-[#e7e7e7] font-light group-hover:text-emerald-400 transition-colors">Taxi Stands</p>
                                    <p className="text-xs text-[#7d7d7d] font-light mt-0.5">Find available taxis</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center group-hover:bg-emerald-400/10 transition-colors">
                                    <svg className="w-4 h-4 text-[#7d7d7d] group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                        <Link
                            href="/map/car"
                            className="group block w-full bg-[#141414] border border-[#212121] rounded-lg hover:border-emerald-400/50 transition-all duration-300 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg text-[#e7e7e7] font-light group-hover:text-emerald-400 transition-colors">Drive Mode</p>
                                    <p className="text-xs text-[#7d7d7d] font-light mt-0.5">Carparks & traffic alerts</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center group-hover:bg-emerald-400/10 transition-colors">
                                    <svg className="w-4 h-4 text-[#7d7d7d] group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="space-y-4 pb-6">
                        <div className="w-full bg-[#141414] border border-[#212121] rounded p-4">
                            <p className="text-xs text-[#7d7d7d] font-normal mb-1">
                                Bus Stops {userLocation && `(${NEARBY_RADIUS_KM}km)`}
                            </p>
                            <p className="text-2xl text-[#e7e7e7] font-normal">
                                {userLocation ? busStops.filter(stop =>
                                    calculateDistance(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude) <= NEARBY_RADIUS_KM
                                ).length : busStops.length}
                            </p>
                        </div>
                        <div className="w-full bg-[#141414] border border-[#212121] rounded p-4">
                            <p className="text-xs text-[#7d7d7d] font-normal mb-1">
                                Carparks {userLocation && `(${NEARBY_RADIUS_KM}km)`}
                            </p>
                            <p className="text-2xl text-[#e7e7e7] font-normal">
                                {userLocation ? carparks.filter(cp =>
                                    cp.Latitude && cp.Longitude && calculateDistance(userLocation.lat, userLocation.lng, cp.Latitude, cp.Longitude) <= NEARBY_RADIUS_KM
                                ).length : carparks.length}
                            </p>
                        </div>
                        <div className="w-full bg-[#141414] border border-[#212121] rounded p-4">
                            <p className="text-xs text-[#7d7d7d] font-normal mb-1">
                                Taxis {userLocation && `(${NEARBY_RADIUS_KM}km)`}
                            </p>
                            <p className="text-2xl text-[#e7e7e7] font-normal">
                                {userLocation ? taxis.filter(taxi =>
                                    calculateDistance(userLocation.lat, userLocation.lng, taxi.Latitude, taxi.Longitude) <= NEARBY_RADIUS_KM
                                ).length : taxis.length}
                            </p>
                        </div>
                        <div className="w-full bg-[#141414] border border-[#212121] rounded p-4">
                            <p className="text-xs text-[#7d7d7d] font-normal mb-1">
                                Traffic Alerts {userLocation && `(${NEARBY_RADIUS_KM}km)`}
                            </p>
                            <p className="text-2xl text-[#e7e7e7] font-normal">
                                {userLocation ? trafficIncidents.filter(incident =>
                                    calculateDistance(userLocation.lat, userLocation.lng, incident.Latitude, incident.Longitude) <= NEARBY_RADIUS_KM
                                ).length : trafficIncidents.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <MapContainer onLocationChange={setUserLocation}>
                    {/* Bus Stop Markers - only within radius */}
                    {busStops.filter(stop => {
                        if (!userLocation) return true;
                        return calculateDistance(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude) <= NEARBY_RADIUS_KM;
                    }).slice(0, 100).map((stop) => (
                        <AdvancedMarker
                            key={stop.BusStopCode}
                            position={{ lat: stop.Latitude, lng: stop.Longitude }}
                            onClick={() => setSelectedBusStop(stop)}
                        >
                            <div className="bg-blue-600 text-white p-1 rounded-full text-xs">
                                🚌
                            </div>
                        </AdvancedMarker>
                    ))}

                    {/* Taxi Markers - only within radius */}
                    {taxis.filter(taxi => {
                        if (!userLocation) return true;
                        return calculateDistance(userLocation.lat, userLocation.lng, taxi.Latitude, taxi.Longitude) <= NEARBY_RADIUS_KM;
                    }).slice(0, 100).map((taxi, index) => {
                        if (!taxi.Latitude || !taxi.Longitude || isNaN(taxi.Latitude) || isNaN(taxi.Longitude)) {
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
                                        className=""
                                        width={32}
                                        height={32}
                                    />
                                </div>
                            </AdvancedMarker>
                        );
                    })}

                    {/* Traffic Incident Markers - only within radius */}
                    {trafficIncidents.filter(incident => {
                        if (!userLocation) return true;
                        return calculateDistance(userLocation.lat, userLocation.lng, incident.Latitude, incident.Longitude) <= NEARBY_RADIUS_KM;
                    }).map((incident, index) => {
                        if (!incident.Latitude || !incident.Longitude || isNaN(incident.Latitude) || isNaN(incident.Longitude)) {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`incident-${index}`}
                                position={{ lat: Number(incident.Latitude), lng: Number(incident.Longitude) }}
                                onClick={() => setSelectedIncident(incident)}
                            >
                                <div className="bg-red-600 text-white p-1 rounded-full text-xs">
                                    ⚠️
                                </div>
                            </AdvancedMarker>
                        );
                    })}

                    {/* Info Windows */}
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

                    {selectedIncident && (
                        <InfoWindow
                            position={{ lat: selectedIncident.Latitude, lng: selectedIncident.Longitude }}
                            onCloseClick={() => setSelectedIncident(null)}
                        >
                            <TrafficAlertInfo
                                type={selectedIncident.Type}
                                message={selectedIncident.Message}
                                onClose={() => setSelectedIncident(null)}
                            />
                        </InfoWindow>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
