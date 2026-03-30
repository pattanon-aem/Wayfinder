'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/UI/Toast';
import MapContainer from '@/components/Map/MapContainer';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import CarparkInfo from '@/components/Map/CarparkInfo';
import MapSidebar from '@/components/Map/MapSidebar';
import SearchResults from '@/components/Map/SearchResults';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { calculateDistance } from '@/lib/utils/mapUtils';
import { getRoute, type RoutePoint } from '@/lib/utils/oneMapApi';
import { saveSearchHistory } from '@/lib/utils/searchHistory';
import { getAIExplanation, type CarContext } from '@/lib/utils/aiExplanation';
import RouteInfoCard from '@/components/Map/RouteInfoCard';
import Image from 'next/image';
import RouteError from '@/components/Map/RouteError';

interface Carpark {
    CarParkID: string;
    Location: string;
    Development: string;
    AvailableLots: number;
    Latitude?: number;
    Longitude?: number;
    distance?: number;
}

export default function CarMapPage() {
    const [carparks, setCarparks] = useState<Carpark[]>([]);
    const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
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
    const [nearestCarparkToDestination, setNearestCarparkToDestination] = useState<Carpark | null>(null);

    useEffect(() => {
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

    const nearestThreeCarparks = userLocation
        ? carparks
            .map(cp => ({
                ...cp,
                distance: calculateDistance(userLocation.lat, userLocation.lng, cp.Latitude!, cp.Longitude!)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
        : carparks.slice(0, 3);

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

                let forecastForNearest: Record<string, number> | null = null;
                try {
                    const dest = route.route[route.route.length - 1];
                    const nearest = carparks
                        .filter(cp => cp.Latitude && cp.Longitude)
                        .map(cp => ({
                            ...cp,
                            distance: calculateDistance(dest.lat, dest.lng, cp.Latitude!, cp.Longitude!)
                        }))
                        .sort((a, b) => a.distance - b.distance)[0];
                    setNearestCarparkToDestination(nearest || null);

                    if (nearest && nearest.CarParkID) {
                        try {
                            forecastForNearest = await fetchForecastForCarpark(nearest.CarParkID);
                        } catch (err) {
                            console.error('Failed to fetch forecast for nearest carpark', err);
                            forecastForNearest = null;
                        }
                    }
                } catch (err) {
                    setNearestCarparkToDestination(null);
                }

                // Fetch AI explanation with parking forecast included when available
                fetchAIExplanation(route.distance, route.duration, destination, forecastForNearest);
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

    const fetchForecastForCarpark = async (carparkId: string): Promise<Record<string, number> | null> => {
        try {
            const res = await fetch(`/api/forecast/carpark/${encodeURIComponent(carparkId)}`);
            if (!res.ok) throw new Error('Forecast fetch failed');
            const text = await res.text();
            let data: any = null;
            try { data = JSON.parse(text); } catch (e) { data = null; }

            if (data && data.predictions && typeof data.predictions === 'object') return data.predictions;
            if (Array.isArray(data)) {
                const r: Record<string, number> = {};
                for (const item of data) {
                    if (item.minutes != null && item.predicted != null) r[String(item.minutes)] = item.predicted;
                }
                return r;
            }
            if (data && Array.isArray((data as any).availableLots) && (data as any).availableLots.length) {
                const arr = (data as any).availableLots as number[];
                const mins = [15, 30, 45, 60];
                const r: Record<string, number> = {};
                mins.forEach((m, i) => { if (arr[i] != null) r[String(m)] = Number(arr[i]); });
                return r;
            }
            if (data && typeof data === 'object') {
                const keys = Object.keys(data).filter(k => ['15', '30', '45', '60'].includes(k));
                if (keys.length) {
                    const r: Record<string, number> = {};
                    for (const k of keys) r[k] = Number((data as any)[k]);
                    return r;
                }
            }
            // fallback: try to extract numbers from raw text
            if (typeof text === 'string') {
                const fallback: Record<string, number> = {};
                (['15', '30', '45', '60'] as const).forEach(k => {
                    const re = new RegExp(`(?:\\"${k}\\"\\s*[:=]|\\b${k}\\b\\s*[:=])\\s*(\\d+)`);
                    const m = text.match(re);
                    if (m && m[1]) fallback[k] = Number(m[1]);
                });
                if (Object.keys(fallback).length) return fallback;
            }
            return null;
        } catch (err) {
            console.error('fetchForecastForCarpark error', err);
            return null;
        }
    };

    const fetchAIExplanation = async (distance: number, duration: number, destination: { lat: number; lng: number }, parkingForecast?: Record<string, number> | null) => {
        setAIExplanation({ text: '', isLoading: true });

        try {
            const nearbyCarparks = carparks
                .filter(cp => cp.Latitude && cp.Longitude)
                .map(cp => ({
                    ...cp,
                    distance: calculateDistance(destination.lat, destination.lng, cp.Latitude!, cp.Longitude!)
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5);

            const parkingInfo = nearbyCarparks.length > 0
                ? nearbyCarparks
                    .map(cp => `${cp.Development || cp.CarParkID}: ${cp.AvailableLots} lots (${Math.round(cp.distance * 1000)}m away)`)
                    .join('; ')
                : 'No nearby carparks found';

            const roadworksData = await fetchRoadworks();
            const roadworksInfo = roadworksData.length > 0 ? roadworksData.join('; ') : 'No roadworks reported';

            const estimatedCost = Math.round((distance / 1000) * 0.5 * 100) / 100;

            const preferredCarpark = nearestCarparkToDestination || nearbyCarparks[0];

            const context: CarContext = {
                distance: Math.round(distance),
                duration: Math.round(duration),
                price: estimatedCost,
                incident: roadworksInfo,
                roadworks: roadworksInfo,
                carparkId: preferredCarpark?.CarParkID || 'Unknown',
                parkingAvailability: preferredCarpark?.AvailableLots || 0,
                parkingForecast: parkingForecast || undefined,
            };

            const explanation = await getAIExplanation('car', context);
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

                {!routeInfo && nearestThreeCarparks.length > 0 && (
                    <>
                        <div className="text-xs text-[#7d7d7d] font-light mt-2 px-2">
                            Nearest Carparks
                        </div>
                        {nearestThreeCarparks.map((carpark, index) => (
                            <button
                                key={`carpark-sidebar-${carpark.CarParkID}-${carpark.Latitude}-${carpark.Longitude}-${index}`}
                                onClick={() => setSelectedCarpark(carpark)}
                                className="w-full bg-[#141414] border border-[#212121] rounded-lg hover:bg-[#161616] cursor-pointer transition-all duration-300 p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <p className="text-sm text-[#e7e7e7] font-medium">{carpark.Development || carpark.CarParkID}</p>
                                        <p className="text-xs text-[#7d7d7d] font-light mt-0.5">
                                            {carpark.AvailableLots} lots available
                                            {carpark.distance && ` • ${carpark.distance.toFixed(2)} km away`}
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

                    {nearestThreeCarparks.map((carpark, index) => {
                        if (!carpark.Latitude || !carpark.Longitude ||
                            isNaN(carpark.Latitude) || isNaN(carpark.Longitude)) {
                            return null;
                        }
                        return (
                            <AdvancedMarker
                                key={`carpark-${carpark.CarParkID}-${carpark.Latitude}-${carpark.Longitude}-${index}`}
                                position={{ lat: Number(carpark.Latitude), lng: Number(carpark.Longitude) }}
                                onClick={() => setSelectedCarpark(carpark)}
                                className='opacity-80 hover:opacity-100 duration-300 transition-opacity'
                            >
                                <Image
                                    src="/parking-marker.png"
                                    alt="Carpark"
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
                            key={`nearest-carpark-dest-${nearestCarparkToDestination.CarParkID}`}
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
                </MapContainer>
            </div>
        </div>
    );
}
