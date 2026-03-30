'use client';

import { useState } from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import { MdClose, MdDirections } from 'react-icons/md';
import { FaBus, FaCar, FaWalking, FaBicycle } from 'react-icons/fa';
import { searchLocation, type RoutingMode } from '@/lib/utils/oneMapApi';

interface SearchResult {
    SEARCHVAL: string;
    BLK_NO: string;
    ROAD_NAME: string;
    BUILDING: string;
    ADDRESS: string;
    POSTAL: string;
    X: string;
    Y: string;
    LATITUDE: string;
    LONGITUDE: string;
}

interface RoutingPanelProps {
    userLocation: { lat: number; lng: number } | null;
    onRouteRequest: (destination: { lat: number; lng: number }, mode: RoutingMode, destinationName: string) => void;
    onClose?: () => void;
}

export default function RoutingPanel({ userLocation, onRouteRequest, onClose }: RoutingPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedMode, setSelectedMode] = useState<RoutingMode>('drive');
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        setShowResults(true);

        try {
            const results = await searchLocation(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectDestination = (result: SearchResult) => {
        const destination = {
            lat: parseFloat(result.LATITUDE),
            lng: parseFloat(result.LONGITUDE),
        };

        onRouteRequest(destination, selectedMode, result.SEARCHVAL);
        setShowResults(false);
        setSearchQuery(result.SEARCHVAL);
    };

    const modes = [
        { id: 'pt' as RoutingMode, icon: FaBus, label: 'Transit', color: 'bg-blue-600' },
        { id: 'drive' as RoutingMode, icon: FaCar, label: 'Drive', color: 'bg-green-600' },
        { id: 'walk' as RoutingMode, icon: FaWalking, label: 'Walk', color: 'bg-purple-600' },
        { id: 'cycle' as RoutingMode, icon: FaBicycle, label: 'Cycle', color: 'bg-orange-600' },
    ];

    return (
        <div className="bg-black shadow-lg rounded-lg p-4 z-50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MdDirections className="text-xl" />
                    <h3 className="text-[#e7e7e7] font-semibold">Get Directions</h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-[#7d7d7d] hover:text-[#e7e7e7] transition-colors"
                    >
                        <MdClose className="text-xl" />
                    </button>
                )}
            </div>

            <div className="relative mb-4">
                <div className="relative">
                    <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d7d7d]" />
                    <input
                        type="text"
                        placeholder="Search destination..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-[#212121] text-[#e7e7e7] pl-10 pr-4 py-2.5 rounded-full border border-[#4e4e4e] focus:border-emerald-400 focus:outline-none transition-colors placeholder-[#7d7d7d]"
                    />
                </div>

                {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#212121] border border-[#4e4e4e] rounded-lg max-h-64 overflow-y-auto z-50 shadow-xl">
                        {isSearching ? (
                            <div className="p-4 text-center text-[#7d7d7d]">Searching...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((result, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectDestination(result)}
                                    className="w-full text-left p-3 hover:bg-[#4e4e4e] transition-colors border-b border-[#4e4e4e] last:border-b-0"
                                >
                                    <div className="text-[#e7e7e7] font-medium">{result.SEARCHVAL}</div>
                                    <div className="text-[#7d7d7d] text-sm mt-1">{result.ADDRESS}</div>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[#7d7d7d]">
                                {searchQuery.length < 2 ? 'Type to search...' : 'No results found'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mode Selection */}
            <div className="space-y-2">
                <p className="text-[#7d7d7d] text-xs mb-2">Travel Mode</p>
                <div className="grid grid-cols-4 gap-2">
                    {modes.map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = selectedMode === mode.id;

                        return (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${isSelected
                                    ? 'bg-emerald-400 text-[#121212]'
                                    : 'bg-[#212121] text-[#7d7d7d] hover:bg-[#4e4e4e] hover:text-[#e7e7e7]'
                                    }`}
                            >
                                <Icon className="text-lg" />
                                <span className="text-xs font-medium">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* User Location Status */}
            {!userLocation && (
                <div className="mt-4 p-3 bg-[#212121] rounded-lg border border-[#4e4e4e]">
                    <p className="text-[#7d7d7d] text-sm">
                        📍 Waiting for your location...
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
        </div>
    );
}
