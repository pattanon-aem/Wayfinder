import React from 'react';

interface CodeFieldProps {
    code: string;
    setCode: (code: string) => void;
    inputsRef: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

function CodeField({ code, setCode, inputsRef }: CodeFieldProps) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 1)
        const newCode = code.split('')
        newCode[idx] = val
        const updatedCode = newCode.join('').padEnd(6, '')
        setCode(updatedCode)
        if (val && idx < 5) {
            inputsRef.current[idx + 1]?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            inputsRef.current[idx - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
        if (paste.length > 1) {
            setCode(paste.padEnd(6, ''))
            setTimeout(() => {
                inputsRef.current[Math.min(paste.length, 5)]?.focus()
            }, 0)
            e.preventDefault()
        }
    }

    return (
        <div className="flex gap-2 w-full justify-center my-4">
            {[...Array(6)].map((_, idx) => (
                <input
                    key={idx}
                    ref={el => { inputsRef.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-10 h-12 text-center border border-[#363636] rounded-lg text-2xl font-medium focus:border-[#4e4e4e] focus:border-1 outline-none transition-all duration-100 ease-in-out"
                    value={code[idx] || ''}
                    onChange={e => handleInputChange(e, idx)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                />
            ))}
        </div>
    )
}

export default CodeField