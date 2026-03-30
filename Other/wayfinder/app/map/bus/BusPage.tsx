'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import BusStopInfo from '@/components/Map/BusStopInfo';
import MapSidebar from '@/components/Map/MapSidebar';
import NearestBusStops from '@/components/Map/NearestBusStops';
import PTRoutePolyline from '@/components/Map/PTRoutePolyline';
import PTRouteStops from '@/components/Map/PTRouteStops';
import SearchResults from '@/components/Map/SearchResults';
import { calculateDistance } from '@/lib/utils/mapUtils';
import type { PTItinerary } from '@/lib/utils/ptRouting';
import { saveSearchHistory } from '@/lib/utils/searchHistory';
import { getAIExplanation, type BusContext } from '@/lib/utils/aiExplanation';
import { toast } from '@/components/UI/Toast';
import { filterIncidentsForItinerary } from '@/lib/utils/incidentsHelper';
import { buildBusRouteSummary } from '@/lib/utils/aiRouteSummary';
import Image from 'next/image';
import { MdClose } from 'react-icons/md';
import RouteError from '@/components/Map/RouteError';

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
    const [selectedItinerary, setSelectedItinerary] = useState<PTItinerary | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(11);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [ptItineraries, setPtItineraries] = useState<PTItinerary[]>([]);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [aiExplanation, setAiExplanation] = useState<{
        text: string;
        isLoading: boolean;
        error?: string;
    }>({ text: '', isLoading: false });

    useEffect(() => {
        fetch('/api/transport/bus-stops')
            .then(res => res.json())
            .then(data => {
                setBusStops(data.value || []);
            })
            .catch((error) => {
                console.error(error);
                toast.show('Failed to load bus stops', 'error');
            });
    }, []);

    const filteredBusStops = searchQuery
        ? busStops.filter(
            (stop) =>
                stop.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stop.BusStopCode.includes(searchQuery) ||
                stop.RoadName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : busStops;

    const getBusStopLimit = (zoom: number) => {
        if (zoom < 14) return 5;
        if (zoom < 16) return 15;
        if (zoom < 18) return 100;
        return 200;
    };

    const nearestThreeStops = userLocation
        ? busStops
            .map(stop => ({
                ...stop,
                distance: calculateDistance(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
        : busStops.slice(0, 3);

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
        await handleRouteRequest(dest, destination.SEARCHVAL);
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

        await handleRouteRequest(dest, address.address);
    };

    const fetchAIExplanation = async (itineraries: PTItinerary[], selectedRoute: PTItinerary, destinationName: string) => {
        setAiExplanation({ text: '', isLoading: true });
        try {
            const incidentsRaw = await fetchTrafficIncidents();
            const incidents = Array.isArray(incidentsRaw) ? incidentsRaw : [];

            const { optionTexts, structuredOptions } = buildBusRouteSummary(
                itineraries,
                selectedRoute,
                (it) => filterIncidentsForItinerary(it as any, incidents, { proximityMeters: 600, timeWindowMinutes: 180 })
            );

            const roadworks = await fetchRoadworks();
            const parts: string[] = [...optionTexts];

            const allNearby = structuredOptions.flatMap(o => o.nearbyIncidents || []);
            if (allNearby && allNearby.length > 0) {
                const uniq = Array.from(new Map(allNearby.map((n: any) => [(n.message || '').slice(0, 120), n])).values());
                const incList = uniq.map((inc: any, i: number) => `${i + 1}. ${inc.message}${inc.lat && inc.lon ? ` (at ${inc.lat},${inc.lon})` : ''}`);
                parts.push(`Incidents: ${incList.join('; ')}`);
            }
            if (roadworks && roadworks.length > 0) {
                parts.push(`Roadworks: ${roadworks.join('; ')}`);
            }

            const summary = parts.join(' || ');
            const explanation = await getAIExplanation('bus', { summary, options: structuredOptions });
            setAiExplanation({ text: explanation, isLoading: false });
        } catch (error) {
            console.error('Error fetching AI explanation:', error);
            setAiExplanation({
                text: '',
                isLoading: false,
                error: 'Unable to generate recommendation at this time. Please try again.',
            });
        }
    };

    const fetchTrafficIncidents = async (): Promise<any[]> => {
        try {
            const response = await fetch('/api/transport/traffic-incidents');
            const data = await response.json();
            return data.value || [];
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
                return data.value.map((rw: any) => rw.EventType || rw.eventType || rw.Message || 'Roadwork').slice(0, 10);
            }
            return [];
        } catch (error) {
            console.error('Error fetching roadworks:', error);
            return [];
        }
    };

    const handleRouteRequest = async (destination: { lat: number; lng: number }, destinationName: string) => {
        if (!userLocation) {
            toast.show('Please allow location access so we can calculate a route.', 'warning');
            return;
        }

        setIsLoadingRoutes(true);
        setPtItineraries([]);
        setSelectedItinerary(null);
        setRouteError(null);
        setAiExplanation({ text: '', isLoading: false });

        try {
            const { getPTRoute } = await import('@/lib/utils/ptRouting');
            const ptResponse = await getPTRoute(userLocation, destination);

            if (ptResponse && ptResponse.plan.itineraries.length > 0) {
                setPtItineraries(ptResponse.plan.itineraries);
                const fastestRoute = ptResponse.plan.itineraries.reduce((fastest, current) =>
                    current.endTime < fastest.endTime ? current : fastest
                );
                setSelectedItinerary(fastestRoute);
                fetchAIExplanation(ptResponse.plan.itineraries, fastestRoute, destinationName);
            } else {
                const errMsg = `No public transport routes found to ${destinationName}.`;
                toast.show(errMsg, 'error');
                setRouteError(errMsg);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            const errMsg = error instanceof Error ? error.message : '';
            if (errMsg.includes('status 500') || errMsg.includes('OneMap API') || errMsg.includes('invalid JSON') || errMsg.includes('non-JSON')) {
                toast.show('Routing provider error, please try again shortly.', 'error');
                setRouteError(`No public transport routes found to ${destinationName}.`);
            } else {
                const errorMsg = error instanceof Error ? error.message : `Failed to fetch bus route to ${destinationName}. Please try again.`;
                toast.show(errorMsg, 'error');
                setRouteError(errorMsg);
            }
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    return (
        <div className="w-full h-screen flex">
            <MapSidebar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                searchPlaceholder="Search destination or bus stop..."
                backHref="/map"
                showSearchResults={showResults && searchResults.length > 0}
                onCustomAddressSelect={handleCustomAddressSelect}
                aiExplanation={aiExplanation}
                searchResults={
                    <SearchResults
                        results={searchResults}
                        onResultClick={handleDestinationSelect}
                    />
                }
            >
                {isLoadingRoutes && (
                    <div className='w-full bg-[#141414] border border-[#212121] rounded p-4 mb-4'>
                        <p className="text-sm text-[#7d7d7d]">Loading bus routes...</p>
                    </div>
                )}

                {routeError && (
                    <RouteError routeError={routeError} />
                )}

                {ptItineraries.length > 0 && ptItineraries.map((itinerary, index) => {
                    const BusRouteCard = require('@/components/Map/BusRouteCard').default;
                    return (
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
                    );
                })}

                {ptItineraries.length === 0 && !isLoadingRoutes && !routeError && !selectedItinerary && (
                    <div className='w-full bg-[#141414] border border-[#212121] rounded p-4'>
                        <p className="text-sm text-[#7d7d7d]">Search for a destination to see bus routes</p>
                    </div>
                )}

                {!selectedItinerary && ptItineraries.length === 0 && (
                    <div className="w-full h-px bg-[#212121]" />
                )}

                {!selectedItinerary && nearestThreeStops.length > 0 && (
                    <>
                        <div className="text-xs text-[#7d7d7d] font-light mt-2 px-2">
                            Nearest Bus Stops
                        </div>
                        <NearestBusStops
                            busStops={nearestThreeStops}
                            onBusStopClick={setSelectedBusStop}
                        />
                    </>
                )}
            </MapSidebar>

            <div className="flex-1 relative">
                <MapContainer onLocationChange={setUserLocation} onZoomChange={setMapZoom}>
                    {selectedItinerary && (
                        <>
                            <PTRoutePolyline itinerary={selectedItinerary} />
                            <PTRouteStops
                                itinerary={selectedItinerary}
                                onStopClick={(stopCode, stopName) => {
                                    const matchingStop = busStops.find(s => s.BusStopCode === stopCode);
                                    if (matchingStop) {
                                        setSelectedBusStop(matchingStop);
                                    }
                                }}
                            />
                        </>
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
                                    onClick={() => setSelectedItinerary(null)}
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

                    {!selectedItinerary && nearestThreeStops.map((stop) => (
                        <AdvancedMarker
                            key={stop.BusStopCode}
                            position={{ lat: stop.Latitude, lng: stop.Longitude }}
                            onClick={() => setSelectedBusStop(stop)}
                            className='opacity-80 hover:opacity-100 duration-300 transition-opacity'
                        >
                            <Image
                                src="/bus-marker.png"
                                alt="Bus Stop"
                                width={24}
                                height={24}
                                quality={100}
                            />
                        </AdvancedMarker>
                    ))}

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
