import { FaWhatsapp } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import Link from 'next/link'
import Image from 'next/image'

function Footer() {
    return (
        <footer className='flex flex-col w-full min-h-[60vh] px-12 md:px-32 py-20'>
            <div className='flex flex-col md:flex-row pb-12 justify-start md:justify-between border-b border-[#1a1a1a] grow-8'>

                <div className='flex flex-col justify-start items-start mb-12'>
                    <Image
                        src="/mark-white.png"
                        alt="Logo"
                        width={24}
                        height={24}
                    />
                </div>

                {/* links section */}
                <div className='flex flex-col md:flex-row gap-6 md:gap-28'>
                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col gap-3'>
                            <div className='tracking-wide text-sm font-medium'>Legal</div>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Terms & Conditions</Link>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Privacy Policy</Link>
                        </div>
                    </div>

                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col gap-3'>
                            <div className='tracking-wide text-sm font-medium'>Features</div>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Customer Requests</Link>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Security</Link>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Pricing</Link>
                        </div>

                    </div>

                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col gap-3'>
                            <div className=' tracking-wide  text-sm font-semibold'>Contact Us</div>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Email</Link>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Instagram</Link>
                            <Link href='/' className='flex items-center gap-2 text-xs text-[#7D7D7D]'>Community</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* bottom section */}
            <div className='flex flex-col md:flex-row py-6 justify-start items-center'>
                <div className='flex text-xs tracking-tight opacity-60'>
                    © 2025 Wayfinder Pte. Ltd.
                </div>
            </div>
        </footer>
    )
}

export default Footer