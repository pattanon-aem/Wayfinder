'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/UI/Toast';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import BusStopInfo from '@/components/Map/BusStopInfo';
import TrafficAlertInfo from '@/components/Map/TrafficAlertInfo';
import BusRouteCard from '@/components/Map/BusRouteCard';
import Link from 'next/link';
import { FaBus, FaCar, FaWalking, FaBicycle } from 'react-icons/fa';
import { calculateDistance, NEARBY_RADIUS_KM } from '@/lib/utils/mapUtils';
import { getRoute, type RoutingMode, type RoutePoint } from '@/lib/utils/oneMapApi';
import { getPTRoute, type PTItinerary } from '@/lib/utils/ptRouting';
import { filterIncidentsForItinerary } from '@/lib/utils/incidentsHelper';
import { saveSearchHistory } from '@/lib/utils/searchHistory';
import { getAIExplanation, type BusContext, type CarContext, type TaxiContext, type WalkCycleContext } from '@/lib/utils/aiExplanation';
import RoutePolyline from '@/components/Map/RoutePolyline';
import PTRoutePolyline from '@/components/Map/PTRoutePolyline';
import PTRouteStops from '@/components/Map/PTRouteStops';
import { MdClose } from 'react-icons/md';
import RouteInfoCard from '@/components/Map/RouteInfoCard';
import Image from 'next/image';
import MapSidebar from '@/components/Map/MapSidebar';
import SearchResults from '@/components/Map/SearchResults';
import RouteError from '@/components/Map/RouteError';
import { buildBusRouteSummary } from '@/lib/utils/aiRouteSummary';

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
    const [selectedMode, setSelectedMode] = useState<RoutingMode>('drive');
    const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; mode: RoutingMode; destination: string } | null>(null);
    const [ptItineraries, setPtItineraries] = useState<PTItinerary[]>([]);
    const [selectedItinerary, setSelectedItinerary] = useState<PTItinerary | null>(null);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(11);
    const [aiExplanation, setAIExplanation] = useState<{
        text: string;
        isLoading: boolean;
        error?: string;
    }>({ text: '', isLoading: false });

    const getBusStopLimit = (zoom: number) => {
        if (zoom < 14) return 5;
        if (zoom < 16) return 15;
        if (zoom < 18) return 100;
        return 200;
    };


    const getDistributedBusStops = (stops: BusStop[], limit: number, minDistanceKm: number) => {
        if (stops.length <= limit) return stops;

        const selected: BusStop[] = [];

        for (const stop of stops) {
            const isFarEnough = selected.every(selectedStop =>
                calculateDistance(
                    stop.Latitude,
                    stop.Longitude,
                    selectedStop.Latitude,
                    selectedStop.Longitude
                ) >= minDistanceKm
            );

            if (isFarEnough) {
                selected.push(stop);
                if (selected.length >= limit) break;
            }
        }

        return selected;
    };

    useEffect(() => {

        fetch('/api/transport/bus-stops')
            .then(res => res.json())
            .then(data => setBusStops(data.value || []))
            .catch((error) => {
                console.error(error);
                toast.show('Failed to load bus stops', 'error');
            });

        fetch('/api/transport/carpark-availability')
            .then(res => res.json())
            .then(data => {
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
            .catch((error) => {
                console.error(error);
                toast.show('Failed to load carpark data', 'error');
            });

        // Subscribe to taxi availability using Server-Sent Events to avoid frequent polling
        // The server provides `/api/transport/taxi-availability/stream` which streams
        // the latest taxi availability payload as SSE messages.
        let es: EventSource | null = null;
        try {
            es = new EventSource('/api/transport/taxi-availability/stream');
            es.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    const validTaxis = (data.value || []).filter((taxi: any) => {
                        const lat = parseFloat(taxi.Latitude);
                        const lng = parseFloat(taxi.Longitude);
                        return !isNaN(lat) && !isNaN(lng);
                    }).map((taxi: any) => ({
                        Latitude: parseFloat(taxi.Latitude),
                        Longitude: parseFloat(taxi.Longitude),
                        rotation: Math.floor(Math.random() * 8) * 45
                    }));
                    setTaxis(validTaxis);
                } catch (e) {
                    console.error('Failed to parse taxi SSE message', e);
                }
            };
            es.onerror = (err) => {
                console.error('Taxi SSE error', err);
                // close on error so browser can attempt reconnect logic if desired
                try { es?.close(); } catch (e) { }
            };
        } catch (e) {
            console.error('Failed to open taxi SSE', e);
        }

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
            .catch((error) => {
                console.error(error);
                toast.show('Failed to load traffic incidents', 'error');
            });

        return () => {
            try { es?.close(); } catch (e) { /* ignore */ }
        };
    }, []);

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
            toast.show('Failed to search location', 'error');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchLocation(value);
    };

    const handleDestinationSelect = async (destination: any) => {
        setSearchQuery(destination.SEARCHVAL);
        setShowResults(false);

        const dest = {
            lat: parseFloat(destination.LATITUDE),
            lng: parseFloat(destination.LONGITUDE),
        };

        await saveSearchHistory(destination.SEARCHVAL, dest.lat, dest.lng);
        handleRouteRequest(dest, selectedMode, destination.SEARCHVAL);
    };

    const handleCustomAddressSelect = async (address: any) => {
        if (!address.latitude || !address.longitude) return;

        setSearchQuery(address.address);
        setShowResults(false);

        const dest = {
            lat: address.latitude,
            lng: address.longitude,
        };

        await saveSearchHistory(address.address, dest.lat, dest.lng);
        handleRouteRequest(dest, selectedMode, address.address);
    };

    const handleRouteSelect = (option: any, destination: any) => {
        const modeMap: Record<string, string> = {
            bus: '/map/bus',
            taxi: '/map/taxi',
            car: '/map/car',
        };

        if (modeMap[option.mode]) {
            window.location.href = `${modeMap[option.mode]}?dest=${encodeURIComponent(destination.SEARCHVAL)}`;
        }
    };

    const handleRouteRequest = async (destination: { lat: number; lng: number }, mode: RoutingMode, destinationName: string) => {
        if (!userLocation) {
            toast.show('Please allow location access so we can calculate a route.', 'warning');
            return;
        }

        setIsLoadingRoutes(true);
        setPtItineraries([]);
        setSelectedItinerary(null);
        setRoutePath([]);
        setRouteInfo(null);
        setRouteError(null);
        setAIExplanation({ text: '', isLoading: false });

        try {
            if (mode === 'pt') {
                const ptResponse = await getPTRoute(userLocation, destination);

                if (ptResponse && ptResponse.plan.itineraries.length > 0) {
                    setPtItineraries(ptResponse.plan.itineraries);

                    // Automatically select the route with shortest ETA (earliest endTime)
                    const fastestRoute = ptResponse.plan.itineraries.reduce((fastest, current) =>
                        current.endTime < fastest.endTime ? current : fastest
                    );
                    setSelectedItinerary(fastestRoute);
                    fetchAIExplanationForPT(fastestRoute, ptResponse.plan.itineraries);
                } else {
                    setRouteError(`No public transport routes found to ${destinationName}.`);
                }
            } else {
                const route = await getRoute(userLocation, destination, mode);

                if (route && route.route.length > 0) {
                    setRoutePath(route.route);
                    setRouteInfo({ distance: route.distance, duration: route.duration, mode, destination: destinationName });

                    // Fetch AI explanation for other modes
                    fetchAIExplanationForMode(mode, route.distance, route.duration, destination);
                } else {
                    setRouteError(`No ${mode} route found to ${destinationName}.`);
                }
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            const errMsg = error instanceof Error ? error.message : '';

            if (errMsg.includes('status 500') || errMsg.includes('OneMap API') || errMsg.includes('invalid JSON') || errMsg.includes('non-JSON')) {
                toast.show('Routing provider error, please try again shortly.', 'error');
                setRouteError(`No public transport routes found to ${destinationName}.`);
            } else {
                const errorMsg = error instanceof Error ? error.message : `Failed to fetch ${mode} route to ${destinationName}. Please try again.`;
                toast.show(errorMsg, 'error');
                setRouteError(errorMsg);
            }
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    const fetchAIExplanationForPT = async (itinerary: PTItinerary, itineraries: PTItinerary[]) => {
        setAIExplanation({ text: '', isLoading: true });

        try {
            // Use the loaded trafficIncidents state (objects with coords) so we can spatially filter them
            const incidents = trafficIncidents || [];
            const { optionTexts, structuredOptions } = buildBusRouteSummary(
                itineraries,
                itinerary,
                (it) => filterIncidentsForItinerary(it as any, incidents, { proximityMeters: 600, timeWindowMinutes: 180 })
            );

            const parts: string[] = [];
            parts.push(...optionTexts);

            // Include only incidents that were matched to any option (de-duplicated)
            const allNearby = structuredOptions.flatMap(o => o.nearbyIncidents || []);
            if (allNearby && allNearby.length > 0) {
                const uniq = Array.from(new Map(allNearby.map((n: any) => [(n.message || '').slice(0, 120), n])).values());
                const incList = uniq.map((inc: any, i: number) => `${i + 1}. ${inc.message}${inc.lat && inc.lon ? ` (at ${inc.lat},${inc.lon})` : ''}`);
                parts.push(`Incidents: ${incList.join('; ')}`);
            }

            const roadworks = await fetchRoadworks();
            if (roadworks && roadworks.length > 0) {
                parts.push(`Roadworks: ${roadworks.join('; ')}`);
            }

            const summary = parts.join(' || ');

            const explanation = await getAIExplanation('bus', { summary, options: structuredOptions });
            setAIExplanation({ text: explanation, isLoading: false });
        } catch (error) {
            console.error('Error fetching AI explanation:', error);
            setAIExplanation({
                text: '',
                isLoading: false,
                error: 'Failed to load AI recommendation'
            });
        }
    };

    const fetchAIExplanationForMode = async (mode: RoutingMode, distance: number, duration: number, destination: { lat: number; lng: number }) => {
        setAIExplanation({ text: '', isLoading: true });

        try {
            if (mode === 'drive') {
                const nearbyCarparks = carparks
                    .filter(cp => cp.Latitude && cp.Longitude)
                    .map(cp => ({
                        ...cp,
                        distance: calculateDistance(destination.lat, destination.lng, cp.Latitude!, cp.Longitude!)
                    }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 3);

                const roadworksData = await fetchRoadworks();
                const roadworksInfo = roadworksData.length > 0 ? roadworksData.join('; ') : 'No roadworks reported';
                const estimatedCost = Math.round((distance / 1000) * 0.5 * 100) / 100;

                const context: CarContext = {
                    distance: Math.round(distance),
                    duration: Math.round(duration),
                    price: estimatedCost,
                    incident: roadworksInfo,
                    roadworks: roadworksInfo,
                    carparkId: nearbyCarparks[0]?.CarParkID || 'Unknown',
                    parkingAvailability: 0
                };

                const explanation = await getAIExplanation('car', context);
                setAIExplanation({ text: explanation, isLoading: false });
            } else if (mode === 'walk' || mode === 'cycle') {
                const incidents = await fetchTrafficIncidents();

                const context: WalkCycleContext = {
                    distance: Math.round(distance),
                    duration: Math.round(duration),
                    incident: incidents.length > 0 ? incidents.join('; ') : 'No incidents reported'
                };

                const explanation = await getAIExplanation(mode, context);
                setAIExplanation({ text: explanation, isLoading: false });
            }
        } catch (error) {
            console.error('Error fetching AI explanation:', error);
            setAIExplanation({
                text: '',
                isLoading: false,
                error: 'Failed to load AI recommendation'
            });
        }
    };

    const fetchTrafficIncidents = async (): Promise<string[]> => {
        try {
            const response = await fetch('/api/transport/traffic-incidents');
            const data = await response.json();
            if (data.value && Array.isArray(data.value)) {
                return data.value.map((inc: any) => inc.Message || 'Incident').slice(0, 3);
            }
            return [];
        } catch (error) {
            console.error('Error fetching traffic incidents:', error);
            return [];
        }
    };

    const fetchRoadworks = async (): Promise<string[]> => {
        try {
            const response = await fetch('/api/transport/roadworks');
            const data = await response.json();
            if (data.value && Array.isArray(data.value)) {
                return data.value.map((rw: any) => rw.EventType || 'Roadwork').slice(0, 5);
            }
            return [];
        } catch (error) {
            console.error('Error fetching roadworks:', error);
            return [];
        }
    };

    return (
        <div className="w-full h-screen relative flex">
            <MapSidebar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                searchPlaceholder="Search destination..."
                backHref="/"
                showSearchResults={showResults && searchResults.length > 0}
                onCustomAddressSelect={handleCustomAddressSelect}
                aiExplanation={aiExplanation}
                searchResults={
                    <SearchResults
                        results={searchResults}
                        onResultClick={handleDestinationSelect}
                    />
                }
                modeButtons={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedMode('pt')}
                            className={`p-2 rounded-full ${selectedMode === 'pt' ? 'bg-emerald-400 text-black' : 'bg-[#212121] text-[#7d7d7d]'}`}
                            title="Transit"
                        >
                            <FaBus />
                        </button>
                        <button
                            onClick={() => setSelectedMode('drive')}
                            className={`p-2 rounded-full ${selectedMode === 'drive' ? 'bg-emerald-400 text-black' : 'bg-[#212121] text-[#7d7d7d]'}`}
                            title="Drive"
                        >
                            <FaCar />
                        </button>
                        <button
                            onClick={() => setSelectedMode('walk')}
                            className={`p-2 rounded-full ${selectedMode === 'walk' ? 'bg-emerald-400 text-black' : 'bg-[#212121] text-[#7d7d7d]'}`}
                            title="Walk"
                        >
                            <FaWalking />
                        </button>
                        <button
                            onClick={() => setSelectedMode('cycle')}
                            className={`p-2 rounded-full ${selectedMode === 'cycle' ? 'bg-emerald-400 text-black' : 'bg-[#212121] text-[#7d7d7d]'}`}
                            title="Cycle"
                        >
                            <FaBicycle />
                        </button>
                    </div>
                }
            >
                {isLoadingRoutes && (
                    <div className='w-full bg-[#141414] border border-[#212121] rounded p-4'>
                        <p className="text-sm text-[#7d7d7d]">Loading routes...</p>
                    </div>
                )}

                {routeError && (
                    <RouteError routeError={routeError} />
                )}

                {selectedMode === 'pt' && ptItineraries.length > 0 && ptItineraries.map((itinerary, index) => (
                    <BusRouteCard
                        key={index}
                        itinerary={itinerary}
                        isSelected={selectedItinerary === itinerary}
                        onClick={() => {
                            setSelectedItinerary(itinerary);
                        }}
                        onDeselect={() => {
                            setSelectedItinerary(null);
                        }}
                    />
                ))}

                {selectedMode === 'pt' && ptItineraries.length === 0 && !isLoadingRoutes && !routeError && (
                    <div className='w-full bg-[#141414] border border-[#212121] rounded p-4'>
                        <p className="text-sm text-[#7d7d7d]">Search for a destination to see bus routes</p>
                    </div>
                )}

                <Link
                    href="/map/bus"
                    className="group block w-full bg-[#141414] border border-[#212121] rounded-lg hover:bg-[#161616] transition-all duration-300 p-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg text-[#e7e7e7] font-light transition-colors">Bus Routes</p>
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
                    className="group block w-full bg-[#141414] border border-[#212121] rounded-lg hover:bg-[#161616] transition-all duration-300 p-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg text-[#e7e7e7] font-light transition-colors">Taxi Stands</p>
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
                    className="group block w-full bg-[#141414] border border-[#212121] rounded-lg hover:bg-[#161616] transition-all duration-300 p-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg text-[#e7e7e7] font-light transition-colors">Drive Mode</p>
                            <p className="text-xs text-[#7d7d7d] font-light mt-0.5">Carparks & traffic alerts</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center group-hover:bg-emerald-400/10 transition-colors">
                            <svg className="w-4 h-4 text-[#7d7d7d] group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </MapSidebar>

            <div className="flex-1 relative">
                <MapContainer onLocationChange={setUserLocation} onZoomChange={setMapZoom}>
                    {routePath.length > 0 && (
                        <RoutePolyline
                            path={routePath.map(p => ({ lat: p.lat, lng: p.lng }))}
                            mode={routeInfo?.mode}
                        />
                    )}

                    {selectedItinerary && (
                        <>
                            <PTRoutePolyline itinerary={selectedItinerary} />
                            <PTRouteStops
                                itinerary={selectedItinerary}
                                onStopClick={(stopCode, stopName) => {
                                    // Find the matching bus stop to show info
                                    const matchingStop = busStops.find(s => s.BusStopCode === stopCode);
                                    if (matchingStop) {
                                        setSelectedBusStop(matchingStop);
                                    }
                                }}
                            />
                        </>
                    )}

                    {routeInfo && (
                        <div className="absolute top-4 right-4">
                            <RouteInfoCard
                                routeInfo={routeInfo}
                                onClose={() => { setRoutePath([]); setRouteInfo(null); }}
                            />
                        </div>
                    )}

                    {selectedItinerary && (
                        <div className="absolute top-4 right-4 z-10 bg-[#141414] border border-[#212121] rounded-lg p-4 shadow-xl max-w-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="text-[#e7e7e7] font-semibold">Bus Route</h4>
                                    <p className="text-[#7d7d7d] text-sm">
                                        {Math.round(selectedItinerary.duration / 60)} min • {selectedItinerary.transfers} transfer{selectedItinerary.transfers !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedItinerary(null); }}
                                    className="text-[#7d7d7d] hover:text-[#e7e7e7]"
                                >
                                    <MdClose className="text-xl" />
                                </button>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <div>
                                    <p className="text-[#7d7d7d]">Walk</p>
                                    <p className="text-[#e7e7e7] font-semibold">{Math.round(selectedItinerary.walkTime / 60)} min</p>
                                </div>
                                {selectedItinerary.fare && (
                                    <div>
                                        <p className="text-[#7d7d7d]">Fare</p>
                                        <p className="text-[#e7e7e7] font-semibold">${selectedItinerary.fare}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Only show nearby bus stops when no PT route is selected */}
                    {!selectedItinerary && (() => {
                        const nearbyStops = busStops.filter(stop => {
                            if (!userLocation) return true;
                            return calculateDistance(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude) <= NEARBY_RADIUS_KM;
                        });
                        const minDistance = mapZoom < 12 ? 0.5 :
                            mapZoom < 14 ? 0.3 :
                                mapZoom < 16 ? 0.15 :
                                    0.05;

                        const limit = getBusStopLimit(mapZoom);
                        const distributedStops = getDistributedBusStops(nearbyStops, limit, minDistance);

                        return distributedStops.map((stop) => (
                            <AdvancedMarker
                                key={stop.BusStopCode}
                                position={{ lat: stop.Latitude, lng: stop.Longitude }}
                                onClick={() => setSelectedBusStop(stop)}
                                className='opacity-80 hover:opacity-100 duration-300 transition-opacity'
                            >
                                <Image
                                    src="/bus-marker.png" alt="Bus Stop"
                                    width={24}
                                    height={24}
                                    quality={100}
                                />
                            </AdvancedMarker>
                        ));
                    })()}

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
                                        src="/taxi5.png"
                                        alt="Taxi"
                                        className=""
                                        width={40}
                                        height={40}
                                    />
                                </div>
                            </AdvancedMarker>
                        );
                    })}

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
                                <Image
                                    src="/roadworks.png" alt="Incident"
                                    width={24}
                                    height={24}
                                    quality={100}
                                />
                            </AdvancedMarker>
                        );
                    })}

                    {routePath.length > 0 && (
                        <AdvancedMarker
                            position={routePath[routePath.length - 1]}
                        >
                            <div className="pointer-events-none">
                                <Image
                                    src="/destination-marker.png" alt="Destination"
                                    width={24}
                                    height={24}
                                    quality={100}
                                />
                            </div>
                        </AdvancedMarker>
                    )}

                    {/* Info Windows */}
                    {selectedBusStop && (
                        <InfoWindow
                            position={{ lat: selectedBusStop!.Latitude, lng: selectedBusStop!.Longitude }}
                            onCloseClick={() => setSelectedBusStop(null)}
                        >
                            <BusStopInfo
                                busStopCode={selectedBusStop!.BusStopCode}
                                busStopName={selectedBusStop!.Description}
                                roadName={selectedBusStop!.RoadName}
                                onClose={() => setSelectedBusStop(null)}
                            />
                        </InfoWindow>
                    )}

                    {selectedIncident && (
                        <InfoWindow
                            position={{ lat: selectedIncident!.Latitude, lng: selectedIncident!.Longitude }}
                            onCloseClick={() => setSelectedIncident(null)}
                        >
                            <TrafficAlertInfo
                                type={selectedIncident!.Type}
                                message={selectedIncident!.Message}
                                onClose={() => setSelectedIncident(null)}
                            />
                        </InfoWindow>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
