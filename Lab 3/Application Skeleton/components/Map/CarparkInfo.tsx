'use client';

import { useState, useEffect } from 'react';
import { Carpark } from '@/lib/types/transport';
import { FaArrowRotateRight } from 'react-icons/fa6';

interface CarparkInfoProps {
    carparkId: string;
    onClose: () => void;
}

export default function CarparkInfo({ carparkId, onClose }: CarparkInfoProps) {
    const [carpark, setCarpark] = useState<Carpark | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="bg-black border border-gray-800 rounded-lg p-4 w-80">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-white font-semibold text-lg">{carpark?.Development || 'Carpark'}</h3>
                    <p className="text-gray-400 text-sm">{carpark?.Area}</p>
                    <p className="text-gray-500 text-xs">ID: {carparkId}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            <div className="flex justify-between items-center mb-3">
                <p className="text-gray-300 text-sm font-medium">Availability</p>
                <button
                    onClick={fetchCarparkData}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-400 disabled:text-gray-600"
                >
                    <FaArrowRotateRight className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <p className="text-red-500 text-sm mb-2">{error}</p>
            )}

            {carpark && !error && (
                <div className="space-y-3">
                    <div className="bg-gray-900 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Available Lots</p>
                        <p className="text-white text-2xl font-bold">{carpark.AvailableLots}</p>
                    </div>

                    <div className="bg-gray-900 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Lot Type</p>
                        <p className="text-white text-sm">{carpark.LotType}</p>
                    </div>

                    {carpark.Location && (
                        <div className="bg-gray-900 rounded p-3">
                            <p className="text-gray-400 text-xs mb-1">Location</p>
                            <p className="text-white text-sm">{carpark.Location}</p>
                        </div>
                    )}

                    {carpark.Agency && (
                        <div className="text-gray-500 text-xs">
                            Managed by {carpark.Agency}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
