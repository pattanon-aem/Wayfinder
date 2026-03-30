'use client';

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { RoutingMode } from '@/lib/utils/oneMapApi';

interface RoutePolylineProps {
    path: google.maps.LatLngLiteral[];
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    mode?: RoutingMode;
}

export default function RoutePolyline({
    path,
    strokeColor = '#00ffc8',
    strokeWeight = 4,
    strokeOpacity = 0.8,
    mode,
}: RoutePolylineProps) {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map || path.length === 0) return;

        const mainOptions: google.maps.PolylineOptions = {
            path,
            geodesic: true,
            strokeColor,
            strokeOpacity,
            strokeWeight,
            map,
        };
        if (mode === 'walk') {
            const dot: google.maps.Symbol = {
                path: google.maps.SymbolPath.CIRCLE,
                fillOpacity: 1,
                fillColor: strokeColor,
                strokeOpacity: 0,
                scale: 4,
            };

            mainOptions.icons = [
                {
                    icon: dot,
                    offset: '0',
                    repeat: '12px',
                },
            ];

            mainOptions.strokeOpacity = 0;
        }

        const polyline = new google.maps.Polyline({ ...mainOptions });
        polyline.setMap(map);
        polylineRef.current = polyline;

        return () => {
            polyline.setMap(null);
        };
    }, [map, path, strokeColor, strokeOpacity, strokeWeight, mode]);

    return null;
}
