'use client'
import React, { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordFieldProps {
    setPassword: (password: string) => void;
    password: string;
    required?: boolean;
}

function PasswordField({ setPassword, password, required }: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className='flex w-full relative'>
            <input
                id="password"
                name='password'
                type={showPassword ? 'text' : 'password'}
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                placeholder="Password"
                className="authInput"
                required={required}
            />
            <button
                type="button"
                className='absolute right-4 top-3.25 text-[#4e4e4e]cursor-pointer'
                onClick={() => setShowPassword((prev) => !prev)}
            >
                {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
        </div>
    )
}

export default PasswordField