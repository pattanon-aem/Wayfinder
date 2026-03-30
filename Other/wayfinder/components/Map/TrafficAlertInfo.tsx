'use client';

import { useState } from 'react';
import { FaArrowRotateRight, FaCarBurst, FaRoadBarrier, FaTrafficLight, FaRoadCircleXmark, FaTriangleExclamation } from 'react-icons/fa6';

interface TrafficAlertInfoProps {
    type: string;
    message: string;
    onClose: () => void;
    onRefresh?: () => void;
}

export default function TrafficAlertInfo({ type, message, onClose, onRefresh }: TrafficAlertInfoProps) {
    const [loading, setLoading] = useState(false);

    const handleRefresh = async () => {
        setLoading(true);
        await onRefresh?.();
        setLoading(false);
    };

    const getAlertIcon = (alertType: string) => {
        switch (alertType.toLowerCase()) {
            case 'accident':
                return <FaCarBurst className="text-red-400 text-xl" />;
            case 'roadwork':
            case 'road work':
                return <FaRoadBarrier className="text-yellow-400 text-xl" />;
            case 'heavy traffic':
                return <FaTrafficLight className="text-orange-400 text-xl" />;
            case 'road closure':
                return <FaRoadCircleXmark className="text-red-400 text-xl" />;
            default:
                return <FaTriangleExclamation className="text-yellow-400 text-xl" />;
        }
    };

    const getAlertColor = (alertType: string) => {
        switch (alertType.toLowerCase()) {
            case 'accident':
                return 'border-red-600';
            case 'roadwork':
            case 'road work':
                return 'border-yellow-600';
            case 'heavy traffic':
                return 'border-orange-600';
            case 'road closure':
                return 'border-red-700';
            default:
                return 'border-gray-600';
        }
    };

    return (
        <div className="flex flex-col p-4 w-80 rounded-lg">
            <div className="flex items-start justify-between gap-3 mb-3 w-full">
                <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="p-2 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
                        {getAlertIcon(type)}
                    </div>
                    <div className="flex flex-col w-full min-w-0 overflow-hidden">
                        <h3 className="text-white font-medium text-lg block truncate whitespace-nowrap">{type}</h3>
                        <p className="text-gray-400 text-xs">Traffic Alert</p>
                    </div>
                </div>

                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-white/5 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FaArrowRotateRight className={loading ? 'animate-spin' : ''} />
                    </button>
                )}
            </div>

            <div>
                <p className="text-gray-300 text-xs mb-1">Description</p>
                <p className="text-[#e7e7e7] text-sm leading-relaxed">{message}</p>
            </div>
        </div>
    );
}
