'use client';

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { PTItinerary } from '@/lib/utils/ptRouting';
import { decodePolyline } from '@/lib/utils/mapUtils';

interface PTRoutePolylineProps {
    itinerary: PTItinerary;
}


export default function PTRoutePolyline({ itinerary }: PTRoutePolylineProps) {
    const map = useMap();
    const polylinesRef = useRef<google.maps.Polyline[]>([]);

    useEffect(() => {
        if (!map) return;

        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        polylinesRef.current = [];

        itinerary.legs.forEach((leg: any) => {
            let path: google.maps.LatLngLiteral[] = [];

            if (leg.legGeometry && leg.legGeometry.points) {
                path = decodePolyline(leg.legGeometry.points);
            } else {
                if (leg.from.lat !== undefined && leg.from.lon !== undefined) {
                    path.push({ lat: leg.from.lat, lng: leg.from.lon });
                }

                if (leg.mode === 'BUS' || leg.mode === 'RAIL' || leg.mode === 'TRANSIT') {
                    leg.intermediateStops?.forEach((stop: any) => {
                        if (stop.lat !== undefined && stop.lon !== undefined) {
                            path.push({ lat: stop.lat, lng: stop.lon });
                        }
                    });
                }

                if (leg.to.lat !== undefined && leg.to.lon !== undefined) {
                    path.push({ lat: leg.to.lat, lng: leg.to.lon });
                }
            }

            if (path.length < 2) return;

            const isWalking = leg.mode === 'WALK';
            const strokeColor = '#00ffc8';

            const polylineOptions: google.maps.PolylineOptions = {
                path,
                geodesic: true,
                strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: 4,
                map,
            };

            if (isWalking) {
                const dot: google.maps.Symbol = {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillOpacity: 1,
                    fillColor: strokeColor,
                    strokeOpacity: 0,
                    scale: 4,
                };

                polylineOptions.icons = [
                    {
                        icon: dot,
                        offset: '0',
                        repeat: '12px',
                    },
                ];

                polylineOptions.strokeOpacity = 0;
            }

            const polyline = new google.maps.Polyline(polylineOptions);
            polyline.setMap(map);
            polylinesRef.current.push(polyline);
        });

        return () => {
            polylinesRef.current.forEach(polyline => polyline.setMap(null));
            polylinesRef.current = [];
        };
    }, [map, itinerary]);

    return null;
}