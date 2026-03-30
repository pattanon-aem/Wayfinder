'use client';

import { useState } from 'react';
import BusRouteCard from './BusRouteCard';
import { getPTRoute, type PTItinerary } from '@/lib/utils/ptRouting';
import RouteError from './RouteError';
import { toast } from '@/components/UI/Toast';

interface PTRoutingSearchProps {
    userLocation: { lat: number; lng: number } | null;
    onItinerarySelect: (itinerary: PTItinerary | null) => void;
    selectedItinerary: PTItinerary | null;
}

export default function PTRoutingSearch({ userLocation, onItinerarySelect, selectedItinerary }: PTRoutingSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [ptItineraries, setPtItineraries] = useState<PTItinerary[]>([]);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);

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

    const handleDestinationSelect = async (destination: any) => {
        setSearchQuery(destination.SEARCHVAL);
        setShowResults(false);

        const dest = {
            lat: parseFloat(destination.LATITUDE),
            lng: parseFloat(destination.LONGITUDE),
        };

        await handleRouteRequest(dest, destination.SEARCHVAL);
    };

    const handleRouteRequest = async (destination: { lat: number; lng: number }, destinationName: string) => {
        if (!userLocation) {
            toast.show('Please allow location access so we can calculate a route.', 'warning');
            return;
        }

        setIsLoadingRoutes(true);
        setPtItineraries([]);
        onItinerarySelect(null);
        setRouteError(null);

        try {
            const ptResponse = await getPTRoute(userLocation, destination);

            if (ptResponse && ptResponse.plan.itineraries.length > 0) {
                setPtItineraries(ptResponse.plan.itineraries);

                // Automatically select the route with shortest ETA (earliest endTime)
                const fastestRoute = ptResponse.plan.itineraries.reduce((fastest, current) =>
                    current.endTime < fastest.endTime ? current : fastest
                );
                onItinerarySelect(fastestRoute);
            } else {
                setRouteError(`No public transport routes found to ${destinationName}. Please check if the OneMap API credentials are configured.`);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            setRouteError(`Failed to fetch bus route to ${destinationName}. Please try again.`);
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    return (
        <>
            <div className="relative w-full mb-4">
                <input
                    type="text"
                    placeholder="Search destination for bus route..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                    className="w-full h-[50px] bg-[#121212] border border-[#383838] rounded-[29px] pl-6 pr-6 text-white text-sm focus:outline-none focus:border-emerald-400/50 transition-colors"
                />

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

            {isLoadingRoutes && (
                <div className='w-full bg-[#141414] border border-[#212121] rounded p-4 mb-4'>
                    <p className="text-sm text-[#7d7d7d]">Loading bus routes...</p>
                </div>
            )}

            {routeError && (
                <RouteError routeError={routeError} />
            )}

            {ptItineraries.length > 0 && ptItineraries.map((itinerary, index) => (
                <BusRouteCard
                    key={index}
                    itinerary={itinerary}
                    isSelected={selectedItinerary === itinerary}
                    onClick={() => {
                        onItinerarySelect(itinerary);
                    }}
                    onDeselect={() => {
                        onItinerarySelect(null);
                    }}
                />
            ))}

            {ptItineraries.length === 0 && !isLoadingRoutes && !routeError && (
                <div className='w-full bg-[#141414] border border-[#212121] rounded p-4 mb-4'>
                    <p className="text-sm text-[#7d7d7d]">Search for a destination to see bus routes</p>
                </div>
            )}
        </>
    );
}
