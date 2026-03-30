'use client';

import { useState } from 'react';
import { FaArrowRotateRight } from 'react-icons/fa6';

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
                return '🚗💥';
            case 'roadwork':
            case 'road work':
                return '🚧';
            case 'heavy traffic':
                return '🚦';
            case 'road closure':
                return '🚫';
            default:
                return '⚠️';
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
        <div className="w-80">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{getAlertIcon(type)}</span>
                    <div>
                        <h3 className="text-[#e7e7e7] font-semibold text-lg">{type}</h3>
                        <p className="text-[#7d7d7d] text-xs">Traffic Alert</p>
                    </div>
                </div>
            </div>

            {onRefresh && (
                <div className="flex justify-end mb-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="text-emerald-400 hover:text-emerald-300 disabled:text-[#7d7d7d] flex items-center gap-2 text-sm"
                    >
                        <FaArrowRotateRight className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            )}

            <div>
                <p className="text-[#7d7d7d] text-xs mb-1">Description</p>
                <p className="text-[#e7e7e7] text-sm leading-relaxed">{message}</p>
            </div>
        </div>
    );
}
