'use client';
import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

type LocalDay = {
  zi: number;
  zi_saptamana: string;
  sfinți: string[];
  tip: string;
  dezlegări: string[];
};

const Sfzi = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [sfinti, setSfinti] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    fetch('/data/calendar.json')
      .then((res) => res.json())
      .then((data: Record<string, LocalDay>) => {
        const entry = data[dateKey];
        if (entry && entry.sfinți?.length > 0) {
          setSfinti(entry.sfinți);
        } else {
          setSfinti(['Niciun sfânt înregistrat azi.']);
        }
      })
      .catch(() => {
        setSfinti(['Eroare la încărcarea calendarului.']);
      });
  }, []);

  return (
  <div className="mt-16 md:mt-32 px-4">
  <div className="flex justify-center">
    <div className="w-full max-w-2xl">
      
      {/* Title */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-xl sm:text-xl md:text-3xl font-normal text-black relative inline-block mb-4"
      >
        Sfinții zilei
        <span className="absolute bottom-0 left-0 w-full h-[2px] "></span>
      </motion.div>

      {/* Saints list */}
      <div className="mt-6 text-sm sm:text-base md:text-lg text-black space-y-3">
        {sfinti.map((nume, i) => (
          <div key={i} className="flex items-center gap-2">
            <Image src="/icons/soare.svg" alt="soare" width={24} height={24} />
            <span>{nume}</span>
          </div>
        ))}
      </div>

      {/* Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeIn' }}
        className="mt-6 inline-block items-center text-xs sm:text-sm md:text-base leading-tight px-4 py-2 border border-[#c95d43] text-black font-normal cursor-pointer rounded-md hover:bg-gray-100 hover:text-black transition"
      >
        <Link href="/Calendar">Vezi calendarul lunii</Link>
      </motion.div>
    </div>
  </div>
</div>

  );
};

export default Sfzi;
