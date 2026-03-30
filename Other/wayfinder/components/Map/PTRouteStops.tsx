'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import Image from 'next/image';
import type { PTItinerary } from '@/lib/utils/ptRouting';

interface PTRouteStopsProps {
    itinerary: PTItinerary;
    onStopClick?: (stopCode: string, stopName: string) => void;
}

export default function PTRouteStops({ itinerary, onStopClick }: PTRouteStopsProps) {
    // Only collect start and end stops for bus/transit legs (not intermediate stops)
    const allStops = new Map<string, { lat: number; lng: number; name: string; stopCode?: string }>();

    itinerary.legs.forEach(leg => {
        // Only add stops for bus/transit legs (skip walking legs)
        if (leg.mode === 'BUS' || leg.mode === 'RAIL' || leg.mode === 'TRANSIT') {
            // Add start stop
            if (leg.from.lat !== undefined && leg.from.lon !== undefined) {
                const key = `${leg.from.lat},${leg.from.lon}`;
                if (!allStops.has(key)) {
                    allStops.set(key, {
                        lat: leg.from.lat,
                        lng: leg.from.lon,
                        name: leg.from.name,
                        stopCode: leg.from.stopCode,
                    });
                }
            }

            // Add end stop
            if (leg.to.lat !== undefined && leg.to.lon !== undefined) {
                const key = `${leg.to.lat},${leg.to.lon}`;
                if (!allStops.has(key)) {
                    allStops.set(key, {
                        lat: leg.to.lat,
                        lng: leg.to.lon,
                        name: leg.to.name,
                        stopCode: leg.to.stopCode,
                    });
                }
            }
        }
    });

    return (
        <>
            {Array.from(allStops.values()).map((stop, index) => (
                <AdvancedMarker
                    key={`route-stop-${index}`}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    onClick={() => onStopClick?.(stop.stopCode || '', stop.name)}
                    className='opacity-100 hover:scale-110 duration-300 transition-transform'
                >
                    <Image
                        src="/bus-marker.png"
                        alt={stop.name}
                        width={24}
                        height={24}
                        quality={100}
                    />
                </AdvancedMarker>
            ))}
        </>
    );
}
