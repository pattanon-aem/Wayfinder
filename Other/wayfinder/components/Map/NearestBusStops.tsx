'use client';

import { useState, useEffect, useRef } from 'react';

interface BusArrival {
    ServiceNo: string;
    NextBus: {
        EstimatedArrival: string;
    };
    NextBus2: {
        EstimatedArrival: string;
    };
}

interface BusStop {
    BusStopCode: string;
    Description: string;
    RoadName: string;
    Latitude: number;
    Longitude: number;
    distance?: number;
}

interface NearestBusStopsProps {
    busStops: BusStop[];
    onBusStopClick: (busStop: BusStop) => void;
}

export default function NearestBusStops({ busStops, onBusStopClick }: NearestBusStopsProps) {
    const [busArrivals, setBusArrivals] = useState<Record<string, BusArrival[]>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const fetchedStopsRef = useRef<Set<string>>(new Set());
    const lastFetchTimeRef = useRef<Record<string, number>>({});

    useEffect(() => {
        // Fetch arrivals for all bus stops, but only if not already fetched recently
        busStops.forEach(stop => {
            const lastFetch = lastFetchTimeRef.current[stop.BusStopCode] || 0;
            const timeSinceLastFetch = Date.now() - lastFetch;

            // Only fetch if we haven't fetched this stop in the last 30 seconds
            if (!fetchedStopsRef.current.has(stop.BusStopCode) || timeSinceLastFetch > 30000) {
                fetchBusArrivals(stop.BusStopCode);
            }
        });
    }, [busStops.map(s => s.BusStopCode).join(',')]);

    const fetchBusArrivals = async (busStopCode: string) => {
        // Skip if already loading
        if (loading[busStopCode]) return;

        fetchedStopsRef.current.add(busStopCode);
        lastFetchTimeRef.current[busStopCode] = Date.now();

        setLoading(prev => ({ ...prev, [busStopCode]: true }));
        try {
            const response = await fetch(`/api/transport/bus-arrival?busStopCode=${busStopCode}`);
            if (!response.ok) throw new Error('Failed to fetch bus arrivals');
            const data = await response.json();
            setBusArrivals(prev => ({ ...prev, [busStopCode]: data.Services || [] }));
        } catch (err) {
            console.error(`Error fetching arrivals for ${busStopCode}:`, err);
        } finally {
            setLoading(prev => ({ ...prev, [busStopCode]: false }));
        }
    };

    const getMinutesUntil = (arrivalTime: string) => {
        if (!arrivalTime) return null;
        const now = new Date();
        const arrival = new Date(arrivalTime);
        const diff = Math.floor((arrival.getTime() - now.getTime()) / 1000 / 60);
        return diff;
    };

    const formatArrivalTime = (minutes: number | null) => {
        if (minutes === null) return 'N/A';
        if (minutes <= 0) return 'Arr';
        if (minutes === 1) return '1 min';
        return `${minutes} mins`;
    };

    return (
        <>
            {busStops.map((stop) => {
                const arrivals = busArrivals[stop.BusStopCode] || [];
                const nextBuses = arrivals.slice(0, 3); // Show up to 3 services

                return (
                    <button
                        key={stop.BusStopCode}
                        onClick={() => onBusStopClick(stop)}
                        className="w-full bg-[#141414] border border-[#212121] rounded-lg hover:bg-[#161616] transition-all duration-300 p-4 cursor-pointer"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-lg text-[#e7e7e7] font-light">{stop.BusStopCode}</p>
                                    <p className="text-xs text-[#7d7d7d] font-light mt-0.5 truncate">{stop.Description}</p>
                                </div>
                                {stop.distance !== undefined && (
                                    <p className="text-xs text-emerald-400 font-light ml-2 flex-shrink-0">
                                        {stop.distance.toFixed(2)} km
                                    </p>
                                )}
                            </div>

                            {loading[stop.BusStopCode] ? (
                                <div className="text-xs text-[#7d7d7d]">Loading arrivals...</div>
                            ) : nextBuses.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {nextBuses.map((bus, idx) => {
                                        const nextMin = getMinutesUntil(bus.NextBus.EstimatedArrival);
                                        const next2Min = getMinutesUntil(bus.NextBus2.EstimatedArrival);

                                        return (
                                            <div
                                                key={`${bus.ServiceNo}-${idx}`}
                                                className="bg-[#1a1a1a] border border-[#4e4e4e] rounded-lg px-2 py-1 flex items-center gap-2"
                                            >
                                                <span className="text-xs text-[#e7e7e7] font-semibold">
                                                    {bus.ServiceNo}
                                                </span>
                                                <span className="text-[10px] text-[#7d7d7d]">
                                                    {formatArrivalTime(nextMin)}
                                                    {next2Min !== null && `, ${formatArrivalTime(next2Min)}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-[#7d7d7d]">No buses available</div>
                            )}
                        </div>
                    </button>
                );
            })}
        </>
    );
}
