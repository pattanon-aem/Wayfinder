'use client'

import Image from "next/image"
import Link from "next/link"
import { GoChevronRight } from "react-icons/go"
import { SignOutButton, useUser } from "@clerk/nextjs"
import { useState, useRef, useEffect } from "react"

function Navbar() {
    const { user } = useUser()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)
    const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false)
            }
        }

        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isProfileDropdownOpen])

    return (
        <>
            <div className="fixed w-full flex px-8 md:px-12 lg:px-30 items-center justify-between h-24 bg-black z-50">
                <Link href='/' className="flex cursor-pointer md:hidden items-center flex-shrink-0">
                    <Image
                        src="/mark-white.png"
                        alt="Logo"
                        width={20}
                        height={20}
                        priority
                        sizes="20px"
                        className="w-[20px] h-[20px] object-contain"
                    />
                </Link>

                <Link href='/' className="cursor-pointer hidden md:flex items-center flex-shrink-0">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={96}
                        height={96}
                        priority
                        sizes="96px"
                        className="w-[96px] h-[96px] object-contain"
                    />
                </Link>

                <div className="hidden md:flex gap-8 text-sm items-center">
                    <Link href='/map/bus' className="flex font-medium text-gray-400 hover:text-white transition-colors">
                        Bus
                    </Link>
                    <Link href='/map/taxi' className="flex font-medium text-gray-400 hover:text-white transition-colors">
                        Taxi
                    </Link>
                    <Link href='/map/car' className="flex font-medium text-gray-400 hover:text-white transition-colors">
                        Car
                    </Link>
                </div>

                <div className="hidden md:flex gap-4 text-xs items-center font-medium">

                    <Link href='/map' className="flex pl-4 pr-3 py-2 bg-gradient-to-br from-[#1c1c1c] to-[#151515] hover:from-[#252525] hover:to-[#1a1a1a] rounded-full items-center gap-1 transition-all">
                        Start Now
                        <GoChevronRight />
                    </Link>

                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={toggleProfileDropdown}
                                className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-gray-800 hover:ring-2 hover:ring-blue-500/30 transition-all"
                            >
                                {user.imageUrl ? (
                                    <Image
                                        src={user.imageUrl}
                                        alt="Profile"
                                        width={32}
                                        height={32}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-400">
                                        {user.firstName?.charAt(0) || user.lastName?.charAt(0) || 'U'}
                                    </span>
                                )}
                            </button>

                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg shadow-lg overflow-hidden">
                                    <div className="px-4 py-3 border-b border-[#1a1a1a]">
                                        <p className="text-sm font-extralight text-white">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs font-extralight text-[#6f6f6f] mt-0.5">{user.primaryEmailAddress?.emailAddress}</p>
                                    </div>
                                    <Link
                                        href='/account'
                                        className="block w-full px-4 py-2.5 text-left text-sm font-light text-[#a8a8a8] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                                    >
                                        Account Settings
                                    </Link>
                                    <SignOutButton>
                                        <button className="w-full px-4 py-2.5 text-left text-sm font-light text-[#a8a8a8] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                                            Sign Out
                                        </button>
                                    </SignOutButton>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href='/sign-in' className="flex text-gray-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                    )}
                </div>

                <button
                    onClick={toggleMenu}
                    className="md:hidden relative w-5 h-5 flex flex-col items-center justify-center gap-1 z-50"
                    aria-label="Toggle menu"
                >
                    <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                    <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
                </button>
            </div>

            <div
                className={`fixed inset-0 bg-black/90 backdrop-blur-md z-40 transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={closeMenu}
            />

            <div
                className={`fixed top-24 right-4 left-4 z-40 transition-all duration-300 ease-out md:hidden ${isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
            >
                <div className="flex flex-col p-4">
                    {user && (
                        <>
                            <div className="flex items-center gap-3 px-3 py-3 mb-2">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-[#111] flex-shrink-0">
                                    {user.imageUrl ? (
                                        <Image
                                            src={user.imageUrl}
                                            alt="Profile"
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <span className="text-sm font-normal text-gray-500">
                                            {user.firstName?.charAt(0) || user.lastName?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-normal text-gray-300 truncate">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {user.primaryEmailAddress?.emailAddress}
                                    </p>
                                </div>
                            </div>
                            <div className="h-px bg-[#1a1a1a] mb-2" />
                        </>
                    )}

                    <div className="flex flex-col space-y-1 mb-2">
                        <Link
                            href='/map/bus'
                            onClick={closeMenu}
                            className="flex items-center px-3 py-2.5 text-sm font-normal text-gray-400 hover:text-gray-300 hover:bg-[#111] rounded-md transition-all"
                        >
                            Bus
                        </Link>
                        <Link
                            href='/map/taxi'
                            onClick={closeMenu}
                            className="flex items-center px-3 py-2.5 text-sm font-normal text-gray-400 hover:text-gray-300 hover:bg-[#111] rounded-md transition-all"
                        >
                            Taxi
                        </Link>
                        <Link
                            href='/map/car'
                            onClick={closeMenu}
                            className="flex items-center px-3 py-2.5 text-sm font-normal text-gray-400 hover:text-gray-300 hover:bg-[#111] rounded-md transition-all"
                        >
                            Car
                        </Link>
                    </div>

                    <div className="h-px bg-[#1a1a1a] mb-2" />

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                        <Link
                            href='/map'
                            onClick={closeMenu}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] rounded-md text-xs font-normal text-gray-300 transition-all"
                        >
                            Start Now
                            <GoChevronRight size={14} />
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    href='/account'
                                    onClick={closeMenu}
                                    className="flex items-center justify-center px-4 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] hover:border-[#2a2a2a] rounded-md text-xs font-normal text-gray-400 hover:text-gray-300 transition-all"
                                >
                                    Account Settings
                                </Link>
                                <SignOutButton>
                                    <button
                                        onClick={closeMenu}
                                        className="flex items-center justify-center px-4 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] hover:border-[#2a2a2a] rounded-md text-xs font-normal text-gray-400 hover:text-gray-300 transition-all cursor-pointer"
                                    >
                                        Sign Out
                                    </button>
                                </SignOutButton>
                            </>
                        ) : (
                            <Link
                                href='/sign-in'
                                onClick={closeMenu}
                                className="flex items-center justify-center px-4 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] hover:border-[#2a2a2a] rounded-md text-xs font-normal text-gray-400 hover:text-gray-300 transition-all"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Navbar