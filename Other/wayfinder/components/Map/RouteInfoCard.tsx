"use client";

import React from "react";
import { MdClose } from "react-icons/md";
import { FaBus, FaCar, FaTaxi, FaWalking } from 'react-icons/fa';
import { MdOutlineAccessTime, MdLocationOn } from 'react-icons/md';

interface RouteInfo {
    destination: string;
    distance: number; // meters
    duration: number; // seconds
    mode?: string;
}

interface Props {
    routeInfo: RouteInfo;
    onClose: () => void;
    className?: string;
    minWidthClass?: string;
    // Optional extra actions or details to render inside the card
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

function ModeIcon({ mode }: { mode?: string }) {
    if (!mode) return null;
    const m = mode.toLowerCase();
    if (m.includes('bus')) return <FaBus className="text-emerald-400" />;
    if (m.includes('car') || m.includes('drive')) return <FaCar className="text-sky-400" />;
    if (m.includes('taxi')) return <FaTaxi className="text-yellow-400" />;
    if (m.includes('walk') || m.includes('cycle')) return <FaWalking className="text-pink-400" />;
    return null;
}

export default function RouteInfoCard({ routeInfo, onClose, className = '', minWidthClass = 'min-w-[16rem]', actions, children }: Props) {
    return (
        <div
            className={`${minWidthClass} z-50 bg-black/70 backdrop-blur-sm border border-white/6 rounded-xl p-3 shadow-xl transition-transform transform hover:scale-[1.01] ${className}`}
            role="region"
            aria-label={`Route to ${routeInfo.destination}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-white/5 rounded-md flex items-center justify-center">
                        <ModeIcon mode={routeInfo.mode} />
                    </div>
                    <div className="min-w-0">
                        <h4 title={routeInfo.destination} className="text-[#e7e7e7] font-semibold text-sm leading-tight truncate max-w-[12rem] sm:max-w-[16rem]">{routeInfo.destination}</h4>
                        {routeInfo.mode && <p title={routeInfo.mode} className="text-[#9aa0a6] text-xs mt-0.5 capitalize truncate">{routeInfo.mode}</p>}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-white/5 text-[#9aa0a6]"
                    aria-label="Close route"
                >
                    <MdClose className="text-base" />
                </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                    <MdLocationOn className="text-[#9aa0a6]" />
                    <div>
                        <p className="text-[#9aa0a6] text-xs">Distance</p>
                        <p className="text-[#e7e7e7] font-semibold text-sm">{(routeInfo.distance / 1000).toFixed(2)} km</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <MdOutlineAccessTime className="text-[#9aa0a6]" />
                    <div>
                        <p className="text-[#9aa0a6] text-xs">Duration</p>
                        <p className="text-[#e7e7e7] font-semibold text-sm">{Math.round(routeInfo.duration / 60)} min</p>
                    </div>
                </div>
            </div>

            {children && (
                <div className="mt-3 text-sm text-[#d1d5db]">{children}</div>
            )}

            {(actions) && (
                <div className="mt-3 flex gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
