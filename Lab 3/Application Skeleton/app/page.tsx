import Card from '@/components/General/Card';
import Footer from '@/components/General/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaChevronRight } from "react-icons/fa6";

export default function Home() {
  return (
    <div className='flex flex-col w-full overflow-x-hidden'>
      <div className="relative min-h-screen flex w-full overflow-visible">
        <div className='absolute inset-0 flex w-full items-start justify-start pt-40 md:pt-44 px-12 md:px-32 z-10'>
          <div className='flex w-full md:w-2/3 flex-col gap-6'>

            <div className=''>
              <h1>
                A smart traffic
              </h1>
              <h1>
                companion for Singapore.
              </h1>
            </div>
            <p className='flex w-2/3 text-xs md:text-base text-[#7D7D7D] leading-relaxed font-normal'>
              Your AI-powered guide to smoother, smarter, and stress-free journeys across Singapore.
            </p>
            <Link href='/map' className='flex justify-center font-medium glowyButton'>
              Start Now
            </Link>
          </div>
        </div>
        <Image
          src="/image.png"
          alt="Hero Background"
          width={2000}
          height={2000}
          quality={100}
          className='w-full object-contain scale-125 md:scale-100 md:object-cover md:translate-x-12 translate-y-1/8 -rotate-4 opacity-80'
          priority
        />
      </div>

      <div className='flex flex-col w-screen h-screen px-12 md:px-32 pt-44 '>
        <div className='flex w-full md:flex-row flex-col justify-center md:justify-between items-center md:items-start md:gap-0 gap-4 mb-16'>
          <div className='w-full md:w-1/3 flex text-center md:text-left justify-center md:justify-start'>
            <h2 className='flex'>
              Real-Time Insights
            </h2>
          </div>
          <p className='text-[#7D7D7D] flex w-full md:w-1/3 text-[12.5px] md:text-right text-center font-medium'>
            Stay ahead of the rush with real-time insights tailored to every commuter. Check accurate bus timings to plan your ride without the wait, track taxi availability so you'll know when and where to book with ease, and explore up-to-date carpark availability to save time on the road.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 h-full md:h-[40vh] gap-8 md:gap-12 w-full'>
          <Card title="Never miss a ride." link="/map/taxi" />
          <Card title="Drive smarter." link="/map/car" />
          <Card title="Instant updates." link="/map/bus" />
        </div>
      </div>
      <Footer />
    </div>
  )
}
