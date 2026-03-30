import React from 'react'
import { RxCross2 } from 'react-icons/rx';

interface ErrorProps {
    error: string;
    setError: (error: string) => void;
}

function Error({ error, setError }: ErrorProps) {

    const cancelError = () => {
        setError('');
    };

    if (!error) return null;
    return (
        <div className='flex flex-row items-center justify-between px-4 py-2 rounded-md text-red-500 border-red-900 border bg-red-900/30 text-xs uppercase w-full font-medium'>
            <div className='w-full truncate overflow-hidden'>
                {error}
            </div>
            <RxCross2 size={14} onClick={cancelError} className='cursor-pointer flex' />
        </div>
    )
}

export default Error