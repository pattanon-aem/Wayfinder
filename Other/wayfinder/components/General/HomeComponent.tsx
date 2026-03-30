'use client';

import { motion } from 'framer-motion';
import Card from '@/components/General/Card';
import Footer from '@/components/General/Footer';
import Image from 'next/image';
import Link from 'next/link';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9 },
    },
};

const container = {
    animate: {
        transition: {
            staggerChildren: 0.18,
            delayChildren: 0.25,
        },
    },
};

export default function HomeComponent() {
    return (
        <div className='flex flex-col w-full overflow-x-hidden'>
            <div className="relative min-h-screen flex w-full overflow-visible">
                <motion.div
                    className='absolute inset-0 flex w-full h-full items-start justify-start pt-40 md:pt-44 px-12 md:px-32 z-10'
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={container}
                >
                    <div className='flex w-full md:w-2/3 flex-col gap-4 items-center md:items-start'>
                        <motion.div className='md:block hidden' variants={fadeUp}>
                            <h1>
                                A smart traffic
                            </h1>
                            <h1>
                                companion for Singapore.
                            </h1>
                        </motion.div>

                        <motion.h1 className='md:hidden flex items-center justify-center w-full text-center' variants={fadeUp}>
                            A smart traffic companion for Singapore.
                        </motion.h1>

                        <motion.p
                            className='flex w-2/3 text-xs md:text-base text-[#7D7D7D] leading-relaxed font-normal text-center md:text-left mb-2'
                            variants={fadeUp}
                        >
                            Your AI-powered guide to smoother, smarter, and stress-free journeys across Singapore.
                        </motion.p>
                        <motion.div variants={fadeUp}>
                            <Link href='/map' className='flex justify-center font-medium glowyButton'>
                                Start Now
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, delay: 0.3 }}
                    viewport={{ once: true, amount: 0.2 }}
                    className='w-full h-screen flex'
                >
                    <Image
                        src="/image.png"
                        alt="Hero Background"
                        width={2000}
                        height={2000}
                        quality={100}
                        className='w-full object-contain scale-125 md:scale-100 md:object-cover md:translate-x-12 translate-y-1/8 -rotate-4 opacity-80'
                        priority
                    />
                </motion.div>
            </div>

            <motion.div
                className='flex flex-col w-screen h-screen px-12 md:px-32 md:pt-44 '
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.2 }}
                variants={container}
            >
                <motion.div
                    className='flex w-full md:flex-row flex-col justify-center md:justify-between items-center md:items-start md:gap-0 gap-4 mb-16'
                    variants={fadeUp}
                >
                    <div className='w-full md:w-1/3 flex text-center md:text-left justify-center md:justify-start'>
                        <h2 className='flex'>
                            Real-Time Insights
                        </h2>
                    </div>
                    <p className='text-[#7D7D7D] flex w-full md:w-1/3 text-[12.5px] md:text-right text-center font-medium'>
                        Stay ahead of the rush with real-time insights tailored to every commuter. Check accurate bus timings to plan your ride without the wait, track taxi availability so you'll know when and where to book with ease, and explore up-to-date carpark availability to save time on the road.
                    </p>
                </motion.div>

                <div className='grid grid-cols-1 md:grid-cols-3 h-full md:h-[40vh] gap-8 md:gap-12 w-full'>
                    <motion.div variants={fadeUp}>
                        <Card title="Never miss a ride." link="/map/taxi" />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <Card title="Drive smarter." link="/map/car" />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <Card title="Instant updates." link="/map/bus" />
                    </motion.div>
                </div>
            </motion.div>
            <Footer />
        </div>
    );
}
