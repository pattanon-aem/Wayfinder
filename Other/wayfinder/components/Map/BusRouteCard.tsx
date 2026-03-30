'use client';

import { useMemo, useState, useEffect } from 'react';
import { IoChevronDown, IoChevronUp, IoChevronForward } from 'react-icons/io5';

interface BusLeg {
    mode: string;
    route?: string;
    routeShortName?: string;
    from: {
        name: string;
        stopCode?: string;
        departure: number;
    };
    to: {
        name: string;
        stopCode?: string;
        arrival: number;
    };
    intermediateStops?: Array<{
        name: string;
        stopCode?: string;
        arrival: number;
        departure: number;
    }>;
    duration: number;
    distance?: number;
}

interface Itinerary {
    duration: number;
    walkTime: number;
    transitTime: number;
    waitingTime: number;
    walkDistance: number;
    transfers: number;
    fare?: string;
    legs: BusLeg[];
    startTime: number;
    endTime: number;
}

interface BusRouteCardProps {
    itinerary: Itinerary;
    onClick?: () => void;
    onDeselect?: () => void;
    isSelected?: boolean;
}

export default function BusRouteCard({ itinerary, onClick, onDeselect, isSelected = false }: BusRouteCardProps) {
    const [isExpanded, setIsExpanded] = useState(isSelected);
    const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setIsExpanded(isSelected);
    }, [isSelected]);

    const busLegs = useMemo(() => {
        return itinerary.legs.filter(leg => leg.mode === 'BUS');
    }, [itinerary.legs]);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getMinutesUntil = (timestamp: number) => {
        const now = Date.now();
        const diff = timestamp - now;
        return Math.max(0, Math.floor(diff / 60000));
    };

    const totalDuration = Math.round(itinerary.duration / 60);

    const handleCardClick = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);

        if (newExpandedState && onClick) {
            onClick();
        } else if (!newExpandedState && onDeselect) {
            onDeselect();
        }
    };

    if (busLegs.length === 0) {
        return null;
    }

    const firstBusLeg = busLegs[0];
    const firstBusDeparture = firstBusLeg.from.departure;
    const nextBusMin = getMinutesUntil(firstBusDeparture);
    const nextBusTime = formatTime(firstBusDeparture);
    const secondBusMin = nextBusMin + 7;
    const secondBusTime = formatTime(firstBusDeparture + 7 * 60000);

    return (
        <div
            className='flex flex-col w-full bg-[#141414] border border-[#212121] rounded-xl  transition-all text-left flex-shrink-0'
        >
            <div
                className='w-full border-b border-[#212121] p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors'
                onClick={handleCardClick}
            >
                <div className='flex justify-between w-full items-center'>
                    <div className='flex-1'>
                        <p className="text-lg text-[#e7e7e7] font-medium">
                            {busLegs.map(leg => leg.routeShortName || leg.route).join(' → ')}
                        </p>
                        <p className="text-xs text-[#7d7d7d] font-light mt-0.5">
                            Bus Route{busLegs.length > 1 ? 's' : ''} • {itinerary.transfers} transfer{itinerary.transfers !== 1 ? 's' : ''} • ${itinerary.fare || 'N/A'}
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <p className="text-lg text-[#e7e7e7] font-medium">{totalDuration} min</p>
                        {isExpanded ? (
                            <IoChevronUp className="text-[#7d7d7d] text-xl flex-shrink-0" />
                        ) : (
                            <IoChevronDown className="text-[#7d7d7d] text-xl flex-shrink-0" />
                        )}
                    </div>
                </div>
            </div>

            <div
                className={`overflow-hidden transition-all duration-400 ease-in-out ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div
                    className='p-4 gap-4 flex flex-col bg-[#121212] w-full'
                    aria-hidden={!isExpanded}
                >
                    <div className='flex flex-row gap-2 w-full'>
                        <div className='flex py-1 px-2 border rounded border-[#4E4E4E] bg-[#1A1A1A] text-xs justify-center items-center gap-2'>
                            <div className='rounded-full bg-white h-1.5 w-1.5' />
                            {nextBusMin} min
                            <span className='flex text-[#7D7D7D]'>{nextBusTime}</span>
                        </div>
                        <div className='flex py-1 px-2 border rounded border-[#4E4E4E] bg-[#1A1A1A] text-xs justify-center items-center gap-2'>
                            <div className='rounded-full bg-white h-1.5 w-1.5' />
                            {secondBusMin} min
                            <span className='flex text-[#7D7D7D]'>{secondBusTime}</span>
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-0 min-w-0'>
                        {busLegs.map((busLeg, legIndex) => (
                            <div key={legIndex}>
                                <div className='flex flex-row items-center gap-3 min-w-0'>
                                    <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                        <div className="w-3 h-3 rounded-full bg-white z-5"></div>
                                    </div>
                                    <div className='w-full justify-between flex items-center min-w-0 flex-1'>
                                        <p title={busLeg.from.name} className="text-xs flex-1 min-w-0 truncate text-white font-normal">
                                            {busLeg.from.name}
                                        </p>
                                        <p className="text-xs flex-shrink-0 text-right text-[#7d7d7d] font-normal ml-2">
                                            {formatTime(busLeg.from.departure)}
                                        </p>
                                    </div>
                                </div>

                                {/* Intermediate stops (show first few) */}
                                {busLeg.intermediateStops && busLeg.intermediateStops.slice(0, expandedStops[legIndex] ? undefined : 3).map((stop, stopIndex) => (
                                    <div key={stopIndex}>
                                        {/* Vertical line */}
                                        <div className='flex flex-row gap-3'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className='w-px h-5 bg-[#2bffb1]' />
                                            </div>
                                        </div>

                                        {/* Stop */}
                                        <div className='flex flex-row items-center gap-3 min-w-0'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className="w-3 h-3 rounded-full bg-[#2bffb1] z-5"></div>
                                            </div>
                                            <div className='w-full justify-between flex items-center min-w-0 flex-1'>
                                                <p title={stop.name} className="text-xs flex-1 min-w-0 truncate text-[#7d7d7d] font-normal">
                                                    {stop.name}
                                                </p>
                                                <p className="text-xs flex-shrink-0 text-right text-[#7d7d7d] font-normal ml-2">
                                                    {formatTime(stop.arrival)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {busLeg.intermediateStops && busLeg.intermediateStops.length > 3 && (
                                    <div>
                                        <div className='flex flex-row gap-3'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className='w-px h-5 bg-[#2bffb1]' />
                                            </div>
                                        </div>
                                        <div className='flex flex-row items-center gap-3 min-w-0'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className="w-3 h-3 rounded-full bg-[#2bffb1] z-5"></div>
                                            </div>
                                            <div className='w-full justify-between flex items-center min-w-0 flex-1'>
                                                <button
                                                    onClick={() => setExpandedStops(prev => ({ ...prev, [legIndex]: !prev[legIndex] }))}
                                                    className="text-xs flex items-center gap-1 text-[#414141] hover:text-[#7d7d7d] font-normal italic transition-colors duration-50 cursor-pointer"
                                                >
                                                    {expandedStops[legIndex]
                                                        ? 'Show less'
                                                        : `Show all (${busLeg.intermediateStops.length - 3} more stops)`
                                                    }
                                                    <IoChevronForward className={`text-xs transition-transform duration-300 ${expandedStops[legIndex] ? 'rotate-90' : 'rotate-0'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Line to destination */}
                                <div className='flex flex-row gap-3'>
                                    <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                        <div className='w-px h-5 bg-[#2bffb1]' />
                                    </div>
                                </div>

                                {/* Destination stop */}
                                <div className='flex flex-row items-center gap-3 min-w-0'>
                                    <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                        <div className="w-3 h-3 rounded-full bg-white z-5"></div>
                                    </div>
                                    <div className='w-full justify-between flex items-center min-w-0 flex-1'>
                                        <p title={busLeg.to.name} className="text-xs flex-1 min-w-0 truncate text-white font-normal">
                                            {busLeg.to.name}
                                        </p>
                                        <p className="text-xs flex-shrink-0 text-right text-[#7d7d7d] font-normal ml-2">
                                            {formatTime(busLeg.to.arrival)}
                                        </p>
                                    </div>
                                </div>

                                {/* Transfer indicator */}
                                {legIndex < busLegs.length - 1 && (
                                    <div>
                                        <div className='flex flex-row gap-3'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className='w-px h-5 bg-[#212121]' />
                                            </div>
                                        </div>
                                        <div className='flex flex-row items-center gap-3 min-w-0'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className="w-6 h-6 rounded-full z-5 p-1.5 bg-[#212121]">
                                                    <div className='border w-full h-full rounded-full bg-black border-[#C3C3C3]' />
                                                </div>
                                            </div>
                                            <div className='w-full justify-between flex items-center min-w-0 flex-1'>
                                                <p className="text-xs flex-1 min-w-0 truncate text-white font-normal">
                                                    Transfer to Bus {busLegs[legIndex + 1].routeShortName || busLegs[legIndex + 1].route}
                                                </p>
                                                <p className="text-xs flex-shrink-0 text-right text-[#7d7d7d] font-normal ml-2">
                                                    {Math.round((busLegs[legIndex + 1].from.departure - busLeg.to.arrival) / 60000)} mins
                                                </p>
                                            </div>
                                        </div>
                                        <div className='flex flex-row gap-3'>
                                            <div className='flex flex-col items-center flex-shrink-0 w-6'>
                                                <div className='w-px h-5 bg-[#212121]' />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
