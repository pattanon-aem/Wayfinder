'use client';

import { createToast } from './Toast';
import { createAlert } from './AlertDialog';

export default function UIProvider({ children }: { children: React.ReactNode }) {
    const ToastContainer = createToast();
    const AlertContainer = createAlert();

    return (
        <>
            {children}
            {ToastContainer && <ToastContainer />}
            {AlertContainer && <AlertContainer />}
        </>
    );
}