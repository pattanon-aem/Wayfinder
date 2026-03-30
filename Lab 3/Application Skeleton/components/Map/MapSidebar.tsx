'use client';

import Link from 'next/link';
import { GoChevronLeft } from 'react-icons/go';
import { IoSearchOutline } from 'react-icons/io5';

interface BusRoute {
    number: string;
    subtitle: string;
    time: string;
}

interface NextBusTime {
    minutes: string;
    timeString: string;
}

interface BusStop {
    name: string;
    arrivalTime: string;
    reached?: boolean;
}

interface MapSidebarProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    backHref?: string;
    title?: string;
    selectedRoute?: BusRoute & {
        nextBuses?: NextBusTime[];
        upcomingStops?: BusStop[];
    };
    routes?: BusRoute[];
    onRouteClick?: (route: BusRoute) => void;
}

export default function MapSidebar({
    searchQuery = '',
    onSearchChange = () => { },
    backHref = '/map',
    title = 'Map View',
    selectedRoute,
    routes = [],
    onRouteClick = () => { },
}: MapSidebarProps) {
    return (
        <div className="absolute flex z-50 w-full max-w-[416px] h-full p-4">
            <div className="flex flex-col p-8 z-50 w-full h-full rounded-xlt bg-black">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={backHref}
                        className="flex-shrink-0 p-3 rounded-full bg-[#121212] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                    >
                        <GoChevronLeft size={20} />
                    </Link>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={title}
                            className="w-full h-[50px] bg-[#121212] border border-[#383838] rounded-[29px] pl-6 pr-12 text-white text-base focus:outline-none focus:border-[#4e4e4e]"
                        />
                        <IoSearchOutline className="absolute right-6 top-1/2 -translate-y-1/2 w-[22px] h-6" />
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex overflow-y-auto">
                    {/* Selected Route Expanded View */}
                    {selectedRoute && (
                        <div className="mb-4">
                            {/* Item Open (Expanded) */}
                            <div className="relative bg-[#141414] rounded-t border border-[#212121] p-4">
                                <p className="text-2xl text-[#e7e7e7] font-normal mb-1">
                                    {selectedRoute.number}
                                </p>
                                <p className="text-xs text-[#7d7d7d] font-normal">
                                    {selectedRoute.subtitle}
                                </p>
                                <p className="absolute top-4 right-4 text-2xl text-[#e7e7e7] font-normal">
                                    {selectedRoute.time}
                                </p>
                            </div>

                            {/* Dropdown (Next Buses & Stops) */}
                            <div className="bg-[#121212] border border-t-0 border-[#212121] rounded-b p-4">
                                {/* Next Bus Times */}
                                {selectedRoute.nextBuses && selectedRoute.nextBuses.length > 0 && (
                                    <div className="flex gap-4 mb-4">
                                        {selectedRoute.nextBuses.map((bus, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 bg-[#1a1a1a] border border-[#4e4e4e] rounded-lg px-3 py-1"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                <span className="text-xs text-[#e7e7e7] font-normal">
                                                    {bus.minutes}
                                                </span>
                                                <span className="text-[10px] text-[#7d7d7d] font-normal">
                                                    • {bus.timeString}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upcoming Stops */}
                                {selectedRoute.upcomingStops && selectedRoute.upcomingStops.length > 0 && (
                                    <div className="space-y-4">
                                        {selectedRoute.upcomingStops.map((stop, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                {/* Stop Indicator */}
                                                <div className="relative flex-shrink-0">
                                                    {stop.reached ? (
                                                        <div className="w-4 h-4 rounded-full bg-[#2AE46E] shadow-[0_0_16px_rgba(42,228,110,0.7)]" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-[#212121] border border-[#C3C3C3] flex items-center justify-center">
                                                            <div className="w-3 h-3 rounded-full bg-[#020202]" />
                                                        </div>
                                                    )}
                                                    {/* Vertical Line */}
                                                    {idx < selectedRoute.upcomingStops!.length - 1 && (
                                                        <div className="absolute left-1/2 top-full -translate-x-1/2 w-0.5 h-8 bg-[#212121]" />
                                                    )}
                                                </div>
                                                {/* Stop Info */}
                                                <div className="flex-1">
                                                    <p className="text-xs text-[#e7e7e7] font-normal">
                                                        {stop.name}
                                                    </p>
                                                    <p className="text-[10px] text-[#4e4e4e] font-normal">
                                                        {stop.arrivalTime}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Route List Items */}
                    <div className="space-y-4 pb-6">
                        {routes.map((route, idx) => (
                            <button
                                key={idx}
                                onClick={() => onRouteClick(route)}
                                className="w-full bg-[#141414] border border-[#212121] rounded hover:bg-[#1a1a1a] transition-colors p-4 text-left"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-2xl text-[#e7e7e7] font-normal mb-1">
                                            {route.number}
                                        </p>
                                        <p className="text-xs text-[#7d7d7d] font-normal">
                                            {route.subtitle}
                                        </p>
                                    </div>
                                    <p className="text-2xl text-[#e7e7e7] font-normal">
                                        {route.time}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
