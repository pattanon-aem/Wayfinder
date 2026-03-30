'use client';

import { useState, useEffect } from 'react';
import { estimateBusFare, estimateTaxiFare, calculateDistance, formatTime } from '@/lib/utils/mapUtils';

interface Location {
  SEARCHVAL: string;
  LATITUDE: string;
  LONGITUDE: string;
  ADDRESS: string;
  POSTAL: string;
}

interface RouteOption {
  mode: 'bus' | 'taxi' | 'car';
  estimatedTime: number; // in minutes
  estimatedCost: number;
  distance: number; // in km
  details: string;
  icon: string;
  color: string;
}

interface DestinationSearchProps {
  userLocation?: { lat: number; lng: number };
  onRouteSelect: (option: RouteOption, destination: Location) => void;
}

export default function DestinationSearch({ userLocation, onRouteSelect }: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Search for location
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/location?searchVal=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  // Calculate route options when destination is selected
  const calculateRoutes = async (destination: Location) => {
    if (!userLocation) return;

    setLoading(true);
    const destLat = parseFloat(destination.LATITUDE);
    const destLng = parseFloat(destination.LONGITUDE);
    const distance = calculateDistance(userLocation.lat, userLocation.lng, destLat, destLng);

    try {
      // Fetch route from OneMap for accurate travel time
      const routeResponse = await fetch(
        `/api/routing/route?start=${userLocation.lat},${userLocation.lng}&end=${destLat},${destLng}&routeType=drive`
      );
      const routeData = await routeResponse.json();

      const drivingTimeMinutes = routeData.route_summary?.total_time 
        ? Math.ceil(routeData.route_summary.total_time / 60) 
        : Math.ceil(distance * 3); // Fallback: ~3 min per km

      // Bus route option
      const busOption: RouteOption = {
        mode: 'bus',
        estimatedTime: drivingTimeMinutes + 10, // Add waiting time
        estimatedCost: estimateBusFare(distance),
        distance,
        details: 'Most economical option',
        icon: '🚌',
        color: 'blue',
      };

      // Taxi route option
      const taxiOption: RouteOption = {
        mode: 'taxi',
        estimatedTime: drivingTimeMinutes + 5, // Add pickup time
        estimatedCost: estimateTaxiFare(distance),
        distance,
        details: 'Fastest and most convenient',
        icon: '🚕',
        color: 'yellow',
      };

      // Car route option
      const carOption: RouteOption = {
        mode: 'car',
        estimatedTime: drivingTimeMinutes,
        estimatedCost: distance * 0.5 + 2, // Rough estimate: fuel + parking
        distance,
        details: 'Drive your own vehicle',
        icon: '🚗',
        color: 'green',
      };

      setRouteOptions([busOption, taxiOption, carOption]);
    } catch (error) {
      console.error('Error calculating routes:', error);
      // Provide fallback estimates
      const fallbackTime = Math.ceil(distance * 3);
      setRouteOptions([
        {
          mode: 'bus',
          estimatedTime: fallbackTime + 10,
          estimatedCost: estimateBusFare(distance),
          distance,
          details: 'Most economical option',
          icon: '🚌',
          color: 'blue',
        },
        {
          mode: 'taxi',
          estimatedTime: fallbackTime + 5,
          estimatedCost: estimateTaxiFare(distance),
          distance,
          details: 'Fastest and most convenient',
          icon: '🚕',
          color: 'yellow',
        },
        {
          mode: 'car',
          estimatedTime: fallbackTime,
          estimatedCost: distance * 0.5 + 2,
          distance,
          details: 'Drive your own vehicle',
          icon: '🚗',
          color: 'green',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDestinationSelect = (location: Location) => {
    setSelectedDestination(location);
    setSearchResults([]);
    setSearchQuery(location.ADDRESS || location.SEARCHVAL);
    calculateRoutes(location);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter destination address..."
          className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        />

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleDestinationSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
              >
                <p className="text-white text-sm font-medium">{result.SEARCHVAL}</p>
                <p className="text-gray-400 text-xs">{result.ADDRESS}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Route Options */}
      {loading && (
        <div className="text-center text-gray-400 py-4">
          Calculating routes...
        </div>
      )}

      {!loading && routeOptions.length > 0 && selectedDestination && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm font-medium">Choose your travel mode:</p>
          {routeOptions.map((option) => (
            <button
              key={option.mode}
              onClick={() => onRouteSelect(option, selectedDestination)}
              className={`w-full bg-gray-900 hover:bg-gray-800 border-2 border-${option.color}-600 rounded-lg p-4 transition-colors text-left`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{option.icon}</span>
                  <div>
                    <p className="text-white font-semibold capitalize">{option.mode}</p>
                    <p className="text-gray-400 text-xs">{option.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">${option.estimatedCost.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">{formatTime(option.estimatedTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>📍 {option.distance.toFixed(1)} km</span>
                <span>⏱️ ~{Math.ceil(option.estimatedTime)} min</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!userLocation && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
          <p className="text-yellow-400 text-sm">
            📍 Please enable location access for accurate route calculations
          </p>
        </div>
      )}
    </div>
  );
}
