'use client';

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface RoutePolylineProps {
    path: google.maps.LatLngLiteral[];
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
}

export default function RoutePolyline({
    path,
    strokeColor = '#34d399', // emerald-400
    strokeWeight = 4,
    strokeOpacity = 0.8,
}: RoutePolylineProps) {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map || path.length === 0) return;

        // Create polyline
        const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor,
            strokeOpacity,
            strokeWeight,
            map,
        });

        polylineRef.current = polyline;

        // Cleanup
        return () => {
            polyline.setMap(null);
        };
    }, [map, path, strokeColor, strokeOpacity, strokeWeight]);

    return null;
}
