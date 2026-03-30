'use client';

import { useState, useEffect } from 'react';
import { FaArrowRotateRight } from 'react-icons/fa6';

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
        <div className="w-80 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-[#e7e7e7] font-semibold text-lg">{busStopName}</h3>
                    <p className="text-[#7d7d7d] text-sm">{roadName}</p>
                    <p className="text-[#7d7d7d] text-xs">Code: {busStopCode}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-3">
                <p className="text-[#e7e7e7] text-sm font-medium">Bus Arrivals</p>
                <button
                    onClick={fetchBusArrivals}
                    disabled={loading}
                    className="text-emerald-400 hover:text-emerald-300 disabled:text-[#7d7d7d]"
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
                    <div key={index} className="border-t border-[#212121] pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[#e7e7e7] font-semibold">{bus.ServiceNo}</span>
                            <div className="flex gap-3 text-sm">
                                <span className="text-emerald-400">{formatTime(bus.NextBus.EstimatedArrival)}</span>
                                <span className="text-yellow-400">{formatTime(bus.NextBus2.EstimatedArrival)}</span>
                                <span className="text-orange-400">{formatTime(bus.NextBus3.EstimatedArrival)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
