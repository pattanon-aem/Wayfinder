"use client";

import { FaMapMarkerAlt } from 'react-icons/fa';
import { FaArrowRotateRight } from 'react-icons/fa6';

interface TaxiStandInfoProps {
    stand: {
        TaxiCode: string;
        Name: string;
        Latitude?: number | string;
        Longitude?: number | string;
        distance?: number;
    };
}

export default function TaxiStandInfo({ stand }: TaxiStandInfoProps) {
    return (
        <div className="flex flex-col p-4 w-72 rounded-lg">
            <div className="flex items-start justify-between gap-3 mb-3 w-full">
                <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="p-2 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
                        <FaMapMarkerAlt className="text-emerald-400" />
                    </div>
                    <div className="flex flex-col w-full min-w-0 overflow-hidden">
                        <h3 title={stand.Name} className="text-white font-medium text-lg block truncate whitespace-nowrap">{stand.Name}</h3>
                        <p className="text-gray-400 text-sm block truncate whitespace-nowrap">Code: {stand.TaxiCode}</p>
                        {stand.distance != null && (
                            <p className="text-gray-500 text-xs mt-1">{stand.distance.toFixed(2)} km away</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
