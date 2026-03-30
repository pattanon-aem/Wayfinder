'use client';

import { useEffect, useState } from 'react';
import { IoCheckmarkCircle, IoClose, IoWarning } from 'react-icons/io5';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

const getIcon = (type: ToastType) => {
    switch (type) {
        case 'success':
            return <IoCheckmarkCircle className="text-emerald-500" size={20} />;
        case 'error':
            return <IoClose className="text-red-500" size={20} />;
        case 'warning':
            return <IoWarning className="text-yellow-500" size={20} />;
    }
};

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [duration, onClose]);

    if (!isMounted) return null;

    // Render as a normal element; the ToastContainer will place these inside a portal wrapper
    return (
        <div
            className={`transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
            `}
        >
            <div className="flex items-center gap-3 min-w-[320px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 shadow-lg justify-between">
                <div className='flex gap-2 items-center'>
                    {getIcon(type)}
                    <p className="text-sm text-gray-200">{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                >
                    <IoClose size={16} className="text-gray-500" />
                </button>
            </div>
        </div>
    );
}

type Toast = {
    message: string;
    type: ToastType;
    id: number;
};

interface ToastContextType {
    show: (message: string, type: ToastType) => void;
}

let toastContext: ToastContextType | null = null;
import React from 'react';
import { IoIosClose, IoIosCloseCircle } from 'react-icons/io';
let ToastContainerSingleton: (() => React.ReactElement | null) | null = null;

export function createToast() {
    if (!toastContext) {
        // Queue to hold toasts fired before the container mounts
        let pending: Toast[] = [];
        let currentId = 0;
        let setToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

        toastContext = {
            show: (message: string, type: ToastType) => {
                const id = currentId++;
                const next = { message, type, id } as Toast;
                if (setToasts) {
                    // Container mounted, prepend newest and trim to 3
                    setToasts((curr) => [next, ...curr].slice(0, 3));
                } else {
                    // Container not yet mounted, enqueue newest-first
                    pending.unshift(next);
                    // keep pending trimmed to last 3
                    if (pending.length > 3) pending = pending.slice(0, 3);
                }
            }
        };

        function ToastContainer() {
            const [localToasts, setLocalToasts] = useState<Toast[]>([]);
            const [mounted, setMounted] = useState(false);

            useEffect(() => {
                setMounted(true);
                setToasts = setLocalToasts;
                // Flush any pending toasts fired before mount (pending newest-first)
                if (pending.length) {
                    // keep newest first and limit to 3
                    setLocalToasts(() => pending.slice(0, 3));
                    pending = [];
                }
                return () => {
                    setToasts = null;
                };
            }, []);

            // Don't render portal until mounted on client
            if (!mounted) return null;

            // Container portal with stacking layout
            return createPortal(
                <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
                    {localToasts.map(toast => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => {
                                setLocalToasts(list =>
                                    list.filter(t => t.id !== toast.id)
                                );
                            }}
                        />
                    ))}
                </div>,
                document.body
            );
        }

        ToastContainerSingleton = ToastContainer;
    }

    return ToastContainerSingleton;
}

export const toast = {
    show: (message: string, type: ToastType) => {
        toastContext?.show(message, type);
    }
};