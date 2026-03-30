'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/UI/Toast';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import MapSidebar from '@/components/Map/MapSidebar';
import SearchResults from '@/components/Map/SearchResults';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { calculateDistance } from '@/lib/utils/mapUtils';
import { getRoute, type RoutePoint } from '@/lib/utils/oneMapApi';
import { saveSearchHistory } from '@/lib/utils/searchHistory';
import { getAIExplanation, type TaxiContext } from '@/lib/utils/aiExplanation';
import { MdClose } from 'react-icons/md';
import RouteInfoCard from '@/components/Map/RouteInfoCard';
import Image from 'next/image';
import RouteError from '@/components/Map/RouteError';
import TaxiStandInfo from '@/components/Map/TaxiStandInfo';
import CarparkInfo from '@/components/Map/CarparkInfo';

interface TaxiStand {
    TaxiCode: string;
    Latitude: number;
    Longitude: number;
    Name: string;
    distance?: number;
}

export default function TaxiMapPage() {
    const [taxiStands, setTaxiStands] = useState<TaxiStand[]>([]);
    const [selectedStand, setSelectedStand] = useState<TaxiStand | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; destination: string } | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [aiExplanation, setAIExplanation] = useState<{
        text: string;
        isLoading: boolean;
        error?: string;
    }>({ text: '', isLoading: false });
    const [carparks, setCarparks] = useState<any[]>([]);
    const [selectedCarpark, setSelectedCarpark] = useState<any | null>(null);
    const [nearestCarparkToDestination, setNearestCarparkToDestination] = useState<any | null>(null);

    useEffect(() => {
        fetchTaxiStands();
        fetchCarparks();
    }, []);

    const fetchCarparks = async () => {
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
        } catch (error) {
            console.error('Error fetching carparks:', error);
            toast.show('Failed to load carpark data', 'error');
        }
    };

    const fetchTaxiStands = async () => {
        try {
            const response = await fetch('/api/transport/taxi-stands');
            const data = await response.json();
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
            toast.show('Failed to load taxi stands', 'error');
        }
    };

    // Get 3 nearest taxi stands with distance
    const nearestThreeStands = userLocation
        ? taxiStands
            .map(stand => ({
                ...stand,
                distance: calculateDistance(userLocation.lat, userLocation.lng, stand.Latitude, stand.Longitude)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
        : taxiStands.slice(0, 3);

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

        // Save to search history
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

        // Save to search history
        await saveSearchHistory(address.address, dest.lat, dest.lng);

        await handleRouteRequest(dest, address.address);
    };

    const handleRouteRequest = async (destination: { lat: number; lng: number }, destinationName: string) => {
        if (!userLocation) {
            toast.show('Please allow location access so we can calculate a route.', 'warning');
            return;
        }

        setIsLoadingRoute(true);
        setRoutePath([]);
        setRouteInfo(null);
        setRouteError(null);
        setAIExplanation({ text: '', isLoading: false });

        try {
            const route = await getRoute(userLocation, destination, 'drive');

            if (route && route.route.length > 0) {
                setRoutePath(route.route);
                setRouteInfo({
                    distance: route.distance,
                    duration: route.duration,
                    destination: destinationName,
                });

                // compute nearest carpark to the destination and show marker
                try {
                    const destLat = route.route[route.route.length - 1].lat;
                    const destLng = route.route[route.route.length - 1].lng;
                    const nearest = carparks
                        .filter(cp => cp.Latitude && cp.Longitude)
                        .map(cp => ({
                            ...cp,
                            distance: calculateDistance(destLat, destLng, cp.Latitude, cp.Longitude)
                        }))
                        .sort((a, b) => a.distance - b.distance)[0];
                    setNearestCarparkToDestination(nearest || null);
                } catch (err) {
                    // ignore if carparks not loaded yet
                    setNearestCarparkToDestination(null);
                }

                // Fetch AI explanation
                fetchAIExplanation(route.distance, route.duration, userLocation);
            } else {
                const errMsg = `No driving route found to ${destinationName}. Please try again.`;
                toast.show(errMsg, 'error');
                setRouteError(errMsg);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            const errorMsg = error instanceof Error ? error.message : `Failed to fetch driving route to ${destinationName}. Please try again.`;
            toast.show(errorMsg, 'error');
            setRouteError(errorMsg);
        } finally {
            setIsLoadingRoute(false);
        }
    };

    const fetchAIExplanation = async (distance: number, duration: number, origin: { lat: number; lng: number }) => {
        setAIExplanation({ text: '', isLoading: true });

        try {
            // Check if it's peak hour (7-9 AM or 5-8 PM on weekdays)
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();
            const isWeekday = day >= 1 && day <= 5;
            const isPeakHour = isWeekday && ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 20));

            // Fetch nearby taxi availability
            const taxiData = await fetchTaxiAvailability(origin);

            // Estimate taxi fare (rough calculation: $3.90 base + $0.60/km + peak surcharge)
            const baseFare = 3.90;
            const perKm = 0.60;
            const peakSurcharge = isPeakHour ? 1.35 : 1.0;
            const estimatedPrice = Math.round((baseFare + (distance / 1000 * perKm)) * peakSurcharge * 100) / 100;

            // Fetch traffic incidents
            const incidents = await fetchTrafficIncidents();

            const context: TaxiContext = {
                distance: Math.round(distance),
                duration: Math.round(duration),
                estimatedPrice,
                nearbyTaxis: taxiData.count,
                isPeakHour,
                surgePricing: isPeakHour,
                incident: incidents.length > 0 ? incidents.join('; ') : 'No incidents reported',
                roadworks: 'Check LTA website for latest updates'
            };

            const explanation = await getAIExplanation('taxi', context);
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

    const fetchTaxiAvailability = async (origin: { lat: number; lng: number }): Promise<{ count: number }> => {
        try {
            const response = await fetch('/api/transport/taxi-availability');
            const data = await response.json();
            if (data.value && Array.isArray(data.value)) {
                // Count taxis within 2km radius
                const nearbyTaxis = data.value.filter((taxi: any) => {
                    const lat = parseFloat(taxi.Latitude);
                    const lng = parseFloat(taxi.Longitude);
                    if (isNaN(lat) || isNaN(lng)) return false;
                    const dist = calculateDistance(origin.lat, origin.lng, lat, lng);
                    return dist <= 2.0; // within 2km
                }).length;
                return { count: nearbyTaxis };
            }
            return { count: 0 };
        } catch (error) {
            console.error('Error fetching taxi availability:', error);
            return { count: 0 };
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

    return (
        <div className="w-full h-screen flex">
            <MapSidebar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                searchPlaceholder="Search destination..."
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
                {/* Loading and Error States */}
                {isLoadingRoute && (
                    <div className='w-full bg-[#141414] border border-[#212121] rounded p-4 mb-4'>
                        <p className="text-sm text-[#7d7d7d]">Loading driving route...</p>
                    </div>
                )}

                {routeError && (
                    <RouteError routeError={routeError} />
                )}

                {routeInfo && !isLoadingRoute && (
                    <RouteInfoCard
                        routeInfo={routeInfo}
                        onClose={() => { setRoutePath([]); setRouteInfo(null); }}
                        className="w-full bg-[#141414] border border-[#212121] rounded p-4 mb-4"
                        minWidthClass={''}
                    />
                )}

                {!routeInfo && !isLoadingRoute && !routeError && (
                    <div className='w-full bg-[#141414] border border-[#212121] rounded p-4'>
                        <p className="text-sm text-[#7d7d7d]">Search for a destination to see driving route</p>
                    </div>
                )}

                {!routeInfo && (
                    <div className="w-full h-px bg-[#212121]" />
                )}

                {!routeInfo && nearestThreeStands.length > 0 && (
                    <>
                        <div className="text-xs text-[#7d7d7d] font-light mt-2 px-2">
                            Nearest Taxi Stands
                        </div>
                        {nearestThreeStands.map((stand, index) => (
                            <button
                                key={`stand-sidebar-${stand.TaxiCode}-${stand.Latitude}-${stand.Longitude}-${index}`}
                                onClick={() => setSelectedStand(stand)}
                                className="w-full bg-[#141414] border border-[#212121] rounded-lg hover:bg-[#161616] cursor-pointer transition-all duration-300 p-4 mt-2"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <p className="text-sm text-[#e7e7e7] font-medium">{stand.Name}</p>
                                        <p className="text-xs text-[#7d7d7d] font-light mt-0.5">
                                            Code: {stand.TaxiCode}
                                            {stand.distance && ` • ${stand.distance.toFixed(2)} km away`}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </MapSidebar>

            <div className="flex-1 relative">
                <MapContainer onLocationChange={setUserLocation}>
                    {routePath.length > 0 && (
                        <RoutePolyline
                            path={routePath.map(p => ({ lat: p.lat, lng: p.lng }))}
                            mode="drive"
                        />
                    )}

                    {nearestThreeStands.map((stand, index) => {
                        if (!stand.Latitude || !stand.Longitude ||
                            isNaN(stand.Latitude) || isNaN(stand.Longitude)) {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`stand-map-${stand.TaxiCode}-${stand.Latitude}-${stand.Longitude}-${index}`}
                                position={{ lat: Number(stand.Latitude), lng: Number(stand.Longitude) }}
                                onClick={() => setSelectedStand(stand)}
                                className='opacity-80 hover:opacity-100 duration-300 transition-opacity'
                            >
                                <Image
                                    src="/taxi-stand.png"
                                    alt="Taxi Stand"
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
                                    src="/destination-marker.png"
                                    alt="Destination"
                                    width={24}
                                    height={24}
                                    quality={100}
                                />
                            </div>
                        </AdvancedMarker>
                    )}

                    {routePath.length > 0 && nearestCarparkToDestination && nearestCarparkToDestination.Latitude && nearestCarparkToDestination.Longitude && (
                        <AdvancedMarker
                            key={`nearest-carpark-dest-${nearestCarparkToDestination.CarParkID || nearestCarparkToDestination.CarParkID}`}
                            position={{ lat: Number(nearestCarparkToDestination.Latitude), lng: Number(nearestCarparkToDestination.Longitude) }}
                            onClick={() => setSelectedCarpark(nearestCarparkToDestination)}
                            className='opacity-90 hover:opacity-100 duration-300 transition-opacity'
                        >
                            <Image
                                src="/parking-marker.png"
                                alt="Nearest Carpark"
                                width={28}
                                height={28}
                                quality={100}
                            />
                        </AdvancedMarker>
                    )}

                    {selectedStand && (
                        <InfoWindow
                            position={{ lat: Number(selectedStand.Latitude), lng: Number(selectedStand.Longitude) }}
                            onCloseClick={() => setSelectedStand(null)}
                        >
                            <TaxiStandInfo
                                stand={selectedStand}
                            />
                        </InfoWindow>
                    )}

                    {selectedCarpark && selectedCarpark.Latitude && selectedCarpark.Longitude && (
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
                </MapContainer>
            </div>
        </div>
    );
}
