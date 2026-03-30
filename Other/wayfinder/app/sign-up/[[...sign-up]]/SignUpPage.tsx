'use client'

import VerificationForm from '@/components/Auth/VerificationForm'
import SignUpForm from '@/components/Auth/SignUpForm'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

function SignUpPage() {
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    const [verifying, setVerifying] = useState(false)

    if (verifying) {
        return (
            <div className='flex w-full items-center h-[92vh] justify-center border-b border-[#363636] px-8'>
                <VerificationForm />
            </div>
        )
    }

    return (
        <div className='flex w-full items-center h-screen justify-center px-8'>
            <SignUpForm setVerifying={setVerifying} />
        </div>
    )
}

export default SignUpPage