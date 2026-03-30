'use client';

import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { createPortal } from 'react-dom';

interface AlertDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export function AlertDialog({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false,
}: AlertDialogProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = (callback: () => void) => {
        setIsVisible(false);
        setTimeout(callback, 200);
    };

    if (!isMounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div
                className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={() => handleClose(onCancel)}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    className={`w-full max-w-md transform transition-all duration-200 ${isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                        }`}
                >
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl">
                        <div className="flex items-start justify-between p-4 border-b border-[#2a2a2a]">
                            <h3 className="text-base font-medium text-gray-200">
                                {title}
                            </h3>
                            <button
                                onClick={() => handleClose(onCancel)}
                                className="p-1 hover:bg-[#2a2a2a] rounded-md transition-colors"
                            >
                                <IoClose size={16} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-300">{message}</p>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-[#2a2a2a]">
                            <button
                                onClick={() => handleClose(onCancel)}
                                className="px-4 py-2 text-sm rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#333] transition-colors"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={() => handleClose(onConfirm)}
                                className={`px-4 py-2 text-sm rounded-md transition-colors ${isDestructive
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

interface AlertContextType {
    show: (props: Omit<AlertDialogProps, 'onCancel'>) => void;
}

let alertContext: AlertContextType | null = null;

export function createAlert() {
    if (!alertContext) {
        type AlertState = {
            props: AlertDialogProps;
            resolve: (value: boolean) => void;
        } | null;

        let currentAlert: AlertState = null;
        let setAlert: React.Dispatch<React.SetStateAction<AlertState>> | null = null;

        alertContext = {
            show: (props) => {
                return new Promise<boolean>((resolve) => {
                    currentAlert = {
                        props: {
                            ...props,
                            onCancel: () => {
                                resolve(false);
                                setAlert?.(null);
                            },
                            onConfirm: () => {
                                resolve(true);
                                props.onConfirm();
                                setAlert?.(null);
                            },
                        },
                        resolve,
                    };
                    setAlert?.(currentAlert);
                });
            },
        };

        function AlertContainer() {
            const [alert, setLocalAlert] = useState<AlertState>(currentAlert);
            setAlert = setLocalAlert;

            if (!alert) return null;
            return <AlertDialog {...alert.props} />;
        }

        return AlertContainer;
    }

    return null;
}

export const alert = {
    show: (props: Omit<AlertDialogProps, 'onCancel'>) => {
        return alertContext?.show(props);
    },
};