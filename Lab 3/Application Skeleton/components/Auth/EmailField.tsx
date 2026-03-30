'use client'
import React from 'react';

interface EmailFieldProps {
    setEmail: (email: string) => void;
    email: string;
    required?: boolean;
}

function EmailField({ setEmail, email, required }: EmailFieldProps) {
    return (
        <input
            id="email"
            type="text"
            name='email'
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="Email"
            className="authInput"
            required={required}
        />
    )
}

export default EmailField