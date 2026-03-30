"use client";

import { useState, useEffect } from 'react';
import { Carpark } from '@/lib/types/transport';
import { FaArrowRotateRight } from 'react-icons/fa6';
import { FaCar } from 'react-icons/fa';

interface CarparkInfoProps {
    carparkId: string;
    onClose: () => void;
}

export default function CarparkInfo({ carparkId, onClose }: CarparkInfoProps) {
    const [carpark, setCarpark] = useState<Carpark | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecast, setForecast] = useState<Record<string, number> | null>(null);
    const [loadingForecast, setLoadingForecast] = useState(false);

    const fetchCarparkData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/transport/carpark-availability');
            if (!response.ok) throw new Error('Failed to fetch carpark data');
            const data = await response.json();
            const carparkData = data.value?.find((cp: any) => cp.CarParkID === carparkId);
            if (carparkData) {
                setCarpark({
                    CarParkID: carparkData.CarParkID,
                    Area: carparkData.Area,
                    Development: carparkData.Development,
                    Location: carparkData.Location,
                    AvailableLots: carparkData.AvailableLots,
                    LotType: carparkData.LotType,
                    Agency: carparkData.Agency,
                });
            } else {
                setError('Carpark not found');
            }
        } catch (err) {
            setError('Failed to load carpark data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarparkData();
    }, [carparkId]);

    useEffect(() => {
        // fetch forecast only when we have a carpark id
        const fetchForecast = async () => {
            setLoadingForecast(true);
            try {
                const res = await fetch(`/api/forecast/carpark/${encodeURIComponent(carparkId)}`);
                // Log response metadata for debugging
                console.debug('[CarparkInfo] forecast response', { status: res.status, ok: res.ok, url: res.url });

                const text = await res.text();
                console.debug('[CarparkInfo] forecast raw text', text.slice ? text.slice(0, 2000) : text);

                let data: any = null;
                try {
                    data = JSON.parse(text);
                    console.debug('[CarparkInfo] forecast parsed JSON', data);
                } catch (parseErr) {
                    console.debug('[CarparkInfo] forecast JSON parse failed, using raw', parseErr);
                    // keep data as null and let downstream logic handle raw
                }

                // support a couple of shapes: {predictions: {15: n,...}} or array
                if (data && data.predictions && typeof data.predictions === 'object') {
                    setForecast(data.predictions);
                } else if (Array.isArray(data)) {
                    const r: Record<string, number> = {};
                    for (const item of data) {
                        if (item.minutes != null && item.predicted != null) r[String(item.minutes)] = item.predicted;
                    }
                    setForecast(r);
                } else if (data && data.raw && typeof data.raw === 'string') {
                    // upstream returned wrapped raw text
                    console.debug('[CarparkInfo] forecast contains raw string in JSON wrapper');
                    setForecast(null);
                } else if (data && typeof data === 'object') {
                    // support shape: { availableLots: [n15, n30, n45, n60] }
                    if (Array.isArray((data as any).availableLots) && (data as any).availableLots.length) {
                        const arr = (data as any).availableLots as number[];
                        const mins = [15, 30, 45, 60];
                        const r: Record<string, number> = {};
                        mins.forEach((m, i) => {
                            if (arr[i] != null) r[String(m)] = Number(arr[i]);
                        });
                        setForecast(r);
                    } else {
                        const keys = Object.keys(data).filter(k => ['15', '30', '45', '60'].includes(k));
                        if (keys.length) {
                            const r: Record<string, number> = {};
                            for (const k of keys) r[k] = Number((data as any)[k]);
                            setForecast(r);
                        } else {
                            setForecast(null);
                        }
                    }
                } else {
                    if (typeof text === 'string') {
                        const fallback: Record<string, number> = {};
                        (['15', '30', '45', '60'] as const).forEach(k => {
                            const re = new RegExp(`(?:\\"${k}\\"\\s*[:=]|\\b${k}\\b\\s*[:=])\\s*(\\d+)`);
                            const m = text.match(re);
                            if (m && m[1]) fallback[k] = Number(m[1]);
                        });
                        if (Object.keys(fallback).length) {
                            console.debug('[CarparkInfo] forecast fallback parsed from text', fallback);
                            setForecast(fallback);
                        } else {
                            setForecast(null);
                        }
                    } else setForecast(null);
                }
            } catch (err) {
                console.error('Failed to load forecast', err);
                setForecast(null);
            } finally {
                setLoadingForecast(false);
            }
        };

        fetchForecast();
    }, [carparkId]);

    return (
        <div className="flex flex-col p-4 w-80">
            <div className="flex items-start justify-between gap-3 mb-3 w-full">
                <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="p-2 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
                        <FaCar className="text-emerald-400" />
                    </div>
                    <div className="flex flex-col w-full min-w-0 overflow-hidden">
                        <h3 title={carpark?.Development || 'Carpark'} className="text-white font-medium text-lg block truncate whitespace-nowrap">{carpark?.Development || 'Carpark'}</h3>
                        <p title={carpark?.Area} className="text-gray-400 text-sm block truncate whitespace-nowrap">{carpark?.Area}</p>
                        <p className="text-gray-500 text-xs">ID: {carparkId}</p>
                    </div>
                </div>

            </div>

            <div className="flex items-center justify-between mb-1">
                <p className="text-gray-300 text-sm font-medium">Available Lots</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCarparkData}
                        disabled={loading}
                        className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-white/5 disabled:opacity-50"
                        aria-label="Refresh carpark availability"
                    >
                        <FaArrowRotateRight className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-sm mb-2">{error}</p>
            )}

            {carpark && !error && (
                <div className="space-y-3">
                    <div className="bg-white/3 rounded p-3">
                        <p className="text-white text-2xl font-bold">{carpark.AvailableLots}</p>
                    </div>

                    <div className="mt-2">
                        <p className="text-gray-300 text-sm font-medium mb-2">Forecast</p>
                        <div className="flex gap-2 text-sm">
                            {[15, 30, 45, 60].map(min => (
                                <div key={min} className="bg-white/3 rounded p-2 flex-1 text-center">
                                    <p className="text-gray-400 text-xs">{min}m</p>
                                    <p className="text-white font-semibold">{
                                        loadingForecast ? '…' : (
                                            forecast && forecast[String(min)] != null ? String(forecast[String(min)]) : '—'
                                        )
                                    }</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
