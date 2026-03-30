'use client'

import SignInForm from "@/components/Auth/SignInForm";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SignInPage() {
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    return (
        <div className='flex w-full items-center h-screen justify-center px-8'>
            <SignInForm />
        </div>
    )
}

export default SignInPage