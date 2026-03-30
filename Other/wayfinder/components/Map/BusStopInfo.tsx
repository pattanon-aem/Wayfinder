'use client';

import { useState, useEffect } from 'react';
import { FaArrowRotateRight, FaBus } from 'react-icons/fa6';

interface BusArrival {
    ServiceNo: string;
    Operator: string;
    NextBus: {
        EstimatedArrival: string;
        Load: string;
        Feature: string;
    };
    NextBus2: {
        EstimatedArrival: string;
        Load: string;
    };
    NextBus3: {
        EstimatedArrival: string;
        Load: string;
    };
}

interface BusStopInfoProps {
    busStopCode: string;
    busStopName: string;
    roadName: string;
    onClose: () => void;
}

export default function BusStopInfo({ busStopCode, busStopName, roadName, onClose }: BusStopInfoProps) {
    const [busArrivals, setBusArrivals] = useState<BusArrival[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBusArrivals = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/transport/bus-arrival?busStopCode=${busStopCode}`);
            if (!response.ok) throw new Error('Failed to fetch bus arrivals');
            const data = await response.json();
            setBusArrivals(data.Services || []);
        } catch (err) {
            setError('Failed to load bus arrival data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((date.getTime() - now.getTime()) / 60000);
        if (diff <= 0) return 'Arr';
        return `${diff} min`;
    };

    useEffect(() => {
        fetchBusArrivals();
    }, [busStopCode]);

    return (
        <div className="flex flex-col p-4 w-80 rounded-lg">
            <div className="flex items-start justify-between gap-3 mb-3 w-full">
                <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="p-2 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
                        <FaBus className="text-emerald-400 text-xl" />
                    </div>
                    <div className="flex flex-col w-full min-w-0 overflow-hidden">
                        <h3 title={busStopName} className="text-white font-medium text-lg block truncate whitespace-nowrap">{busStopName}</h3>
                        <p title={roadName} className="text-gray-400 text-sm block truncate whitespace-nowrap">{roadName}</p>
                        <p className="text-gray-500 text-xs">Code: {busStopCode}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 text-sm font-medium">Bus Arrivals</p>
                <button
                    onClick={fetchBusArrivals}
                    disabled={loading}
                    className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-white/5 disabled:opacity-50"
                    aria-label="Refresh arrivals"
                >
                    <FaArrowRotateRight className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <p className="text-red-500 text-sm mb-2">{error}</p>
            )}

            <div className="space-y-2">
                {busArrivals.length === 0 && !loading && (
                    <p className="text-[#7d7d7d] text-sm">No buses at this stop</p>
                )}
                {busArrivals.map((bus, index) => (
                    <div key={index} className="bg-white/2 rounded p-2 border border-[#1a1a1a]">
                        <div className="flex justify-between items-center">
                            <span className="text-[#e7e7e7] font-semibold">{bus.ServiceNo}</span>
                            <div className="flex gap-3 text-sm">
                                <span className="text-emerald-400">{formatTime(bus.NextBus.EstimatedArrival)}</span>
                                <span className="text-yellow-300">{formatTime(bus.NextBus2.EstimatedArrival)}</span>
                                <span className="text-orange-300">{formatTime(bus.NextBus3.EstimatedArrival)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
