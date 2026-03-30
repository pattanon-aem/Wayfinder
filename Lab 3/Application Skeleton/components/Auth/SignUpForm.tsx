'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useSignUp } from '@clerk/nextjs'
import PasswordField from './PasswordField'
import EmailField from './EmailField'
import AuthDivider from './AuthDivider'
import { FaGoogle } from 'react-icons/fa'
import Error from './Error'

interface SignUpFormProps {
    setVerifying: (verifying: boolean) => void;
}

function SignUpForm({ setVerifying }: SignUpFormProps) {
    const { isLoaded, signUp } = useSignUp()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const [loading, setLoading] = useState(false)
    const [signUpMethod, setSignUpMethod] = useState<'email' | 'google'>('email')


    async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
        ev.preventDefault()
        if (!isLoaded && !signUp) return null
        setLoading(true);
        setError('');


        if (signUpMethod === 'google') {
            try {

                signUp.authenticateWithRedirect({
                    strategy: 'oauth_google',
                    redirectUrl: '/sign-up/sso-callback',
                    redirectUrlComplete: '/dashboard',
                    // unsafeMetadata,
                })
            } catch (error) {
                console.error('Error during sign up via Google:', error);
                setError((error as Error)?.message || 'An error occurred during sign up via Google');
            }
            return
        }

        try {
            await signUp.create({
                emailAddress: email,
                password: password,
                // unsafeMetadata,
            })

            await signUp.prepareEmailAddressVerification()
            setVerifying(true)
        } catch (err) {
            console.error('Error during sign up:', err);
            setError((err as Error)?.message || 'An error occurred during sign up');
        }
        setLoading(false);
    }


    return (
        <form onSubmit={handleSubmit} className='flex w-full md:w-[30vw] items-center justify-center flex-col gap-4 transition-all duration-300 ease-in-out'>
            <h1 className='font-normal'>Sign Up</h1>
            <h4 className="text-xs uppercase mb-3 mt-2">Have an account? <span className="underline hover:text-textColor transition-colors ease-in-out duration-300">
                <Link href='/sign-in'>
                    Sign in
                </Link>
            </span>.
            </h4>

            <Error error={error} setError={setError} />

            <EmailField setEmail={setEmail} required={signUpMethod === 'email'} email={email} />

            <PasswordField setPassword={setPassword} required={signUpMethod === 'email'} password={password} />

            <div id="clerk-captcha" />

            <button onClick={() => setSignUpMethod('email')} type='submit' className='authButton2'>
                {loading && signUpMethod === 'email' ? (
                    <>
                        Signing Up
                        <div className='animate-spin ml-3 border-1 border-t-transparent h-3 w-3 rounded-full' />
                    </>
                ) :
                    'Sign In'
                }
            </button>

            <AuthDivider />

            <button onClick={() => setSignUpMethod('google')} type='submit' className='authButton1'>
                {loading && signUpMethod === 'google' ? (
                    <>
                        Signing Up
                        <div className='animate-spin ml-3 border-1 border-t-transparent h-3 w-3 rounded-full' />
                    </>
                ) :
                    <>
                        Sign up with Google
                        <FaGoogle size={16} />
                    </>
                }

            </button>

        </form>

    )
}

export default SignUpForm