'use client';

import Link from 'next/link';
import { GoChevronLeft } from 'react-icons/go';
import { IoSearchOutline, IoHome, IoBriefcase, IoSchool, IoLocationSharp, IoSparklesSharp } from 'react-icons/io5';
import { ReactNode, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { MdDragHandle } from 'react-icons/md';

interface CustomAddress {
    _id: string;
    addressName: string;
    address: string;
    latitude?: number;
    longitude?: number;
}

interface MapSidebarProps {
    searchQuery?: string;
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchFocus?: () => void;
    searchPlaceholder?: string;
    backHref?: string;
    showSearchResults?: boolean;
    searchResults?: ReactNode;
    modeButtons?: ReactNode;
    children?: ReactNode;
    onCustomAddressSelect?: (address: CustomAddress) => void;
    aiExplanation?: {
        text: string;
        isLoading: boolean;
        error?: string;
    };
}

export default function MapSidebar({
    searchQuery = '',
    onSearchChange,
    onSearchFocus,
    searchPlaceholder = 'Search destination...',
    backHref = '/',
    showSearchResults = false,
    searchResults,
    modeButtons,
    children,
    onCustomAddressSelect,
    aiExplanation,
}: MapSidebarProps) {
    const { user, isLoaded } = useUser();
    const [customAddresses, setCustomAddresses] = useState<CustomAddress[]>([]);
    const [showAddresses, setShowAddresses] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Toggle expand/collapse for mobile drag handle
    const openMenu = () => setIsExpanded(prev => !prev);

    useEffect(() => {
        if (isLoaded && user) {
            fetchCustomAddresses();
        }
    }, [isLoaded, user]);

    useEffect(() => {
        const isLoading = aiExplanation?.isLoading ?? false;
        const messages = [
            'Sending request to AI…',
            'Processing route details…',
            'Optimising options, please keep this tab open',
            'First request may take up to 60s while AI wakes up',
        ];

        let idx = 0;
        let timer: number | undefined;

        if (isLoading) {
            setLoaderMessage(messages[0]);
            timer = window.setInterval(() => {
                idx = (idx + 1) % messages.length;
                setLoaderMessage(messages[idx]);
            }, 3000);
        } else {
            setLoaderMessage(null);
        }

        return () => {
            if (timer) window.clearInterval(timer);
        };
    }, [aiExplanation?.isLoading]);

    const fetchCustomAddresses = async () => {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const data = await response.json();
                setCustomAddresses(data.user.customAddresses || []);
            }
        } catch (error) {
            console.error('Error fetching custom addresses:', error);
        }
    };

    const getAddressIcon = (name: string) => {
        switch (name) {
            case 'Home':
                return <IoHome size={14} className="text-emerald-500" />;
            case 'Work':
                return <IoBriefcase size={14} className="text-blue-500" />;
            case 'School':
                return <IoSchool size={14} className="text-purple-500" />;
            default:
                return <IoLocationSharp size={14} className="text-gray-500" />;
        }
    };

    return (
        <div className={`absolute md:top-0 bottom-0 flex ${isExpanded ? 'max-h-screen' : 'max-h-[45vh]'} z-50 w-screen md:p-4 md:max-w-[416px] md:max-h-full h-full overflow-hidden pointer-events-none transition-[max-height] duration-300 ease-in-out`} style={{ isolation: 'isolate' }}>
            <div
                className="md:rounded-[32px] flex w-full h-full flex-col bg-[#060606] px-6 pb-6 md:p-6 shadow-lg shadow-black/50 pointer-events-auto"
                onWheelCapture={(e) => {
                    const target = e.currentTarget.querySelector('[data-scrollable]');
                    if (target) {
                        e.stopPropagation();
                    }
                }}
            >
                <button onClick={openMenu} aria-label="Drag handle" className='w-full flex md:hidden items-center pt-2 pb-3 justify-center'>
                    <MdDragHandle size={24} className='text-[#202020]' />
                </button>
                <div className="flex flex-col gap-4 mb-4 w-full">
                    <div className="flex relative items-center gap-4 w-full">
                        <Link
                            href={backHref}
                            className="flex-shrink-0 p-1 rounded-full bg-[#121212] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                        >
                            <GoChevronLeft className='text-[#747474] text-2xl' />
                        </Link>

                        <div className="relative w-full flex-1">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={onSearchChange}
                                onFocus={(e) => {
                                    onSearchFocus?.();
                                    setShowAddresses(true);
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowAddresses(false), 200);
                                }}
                                className="w-full py-2 bg-[#121212] border border-[#383838] rounded-[29px] pl-6 pr-12 text-white text-sm focus:outline-none focus:border-emerald-400/50 transition-colors"
                            />
                            <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#7d7d7d]" />


                        </div>

                        {showSearchResults && searchResults}

                        {showAddresses && customAddresses.length > 0 && !showSearchResults && (
                            <div className="absolute top-10 mt-2 w-full bg-[#000000] shadow-lg shadow-black/50 border border-[#242424] rounded-lg max-h-[300px] overflow-y-auto z-30">

                                {customAddresses.map((address) => (
                                    <button
                                        key={address._id}
                                        onClick={() => {
                                            onCustomAddressSelect?.(address);
                                            setShowAddresses(false);
                                        }}
                                        className="w-full text-left p-4 hover:bg-[#111] transition-colors border-b border-[#242424] last:border-b-0 flex items-center gap-2"
                                    >
                                        {getAddressIcon(address.addressName)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-300 font-medium">{address.addressName}</p>
                                            <p className="text-[11px] text-gray-600 truncate">{address.address}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>



                    {modeButtons}
                </div>


                <div
                    data-scrollable
                    className="flex flex-col gap-4 flex-1 overflow-y-auto overscroll-contain min-h-0 relative"
                    style={{ touchAction: 'pan-y' }}
                >
                    {aiExplanation && (aiExplanation.text || aiExplanation.isLoading || aiExplanation.error) && (
                        <div className="w-full bg-gradient-to-br from-teal-950/50 to-emerald-900/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <IoSparklesSharp size={16} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-emerald-300 mb-2">AI Recommendation</h3>

                                    {aiExplanation.isLoading && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-emerald-200 font-medium">Working on it</p>
                                                <p className="text-[11px] text-emerald-400/70 mt-1">
                                                    {loaderMessage ?? 'Preparing request...'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {aiExplanation.error && !aiExplanation.isLoading && (
                                        <div className="text-xs text-red-400/80">
                                            <p className="font-medium mb-1">Unable to generate recommendation</p>
                                            <p className="text-[11px] text-red-400/60">{aiExplanation.error}</p>
                                        </div>
                                    )}

                                    {aiExplanation.text && !aiExplanation.isLoading && !aiExplanation.error && (
                                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                                            {aiExplanation.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}
