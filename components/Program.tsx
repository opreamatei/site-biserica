'use client';
import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import VerticalParallax from './Parallax';

type Activitate = {
  nume: string;
  ora: string;
};

type Zi = {
  data: string;
  activitati: Activitate[];
};

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const Program = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const [ziAzi, setZiAzi] = useState<Zi | null>(null);

  useEffect(() => {
    const getProgram = async () => {
      try {
        const res = await fetch('/data/program.json');
        const data = await res.json();

        const zileOrd = [
          'duminică',
          'luni',
          'marți',
          'miercuri',
          'joi',
          'vineri',
          'sâmbătă'
        ];

        const azi = new Date();
        const ziIndex = azi.getDay();
        const ziCurenta = zileOrd[ziIndex];
        const ziAziData: Zi = data[ziCurenta];

        setZiAzi(ziAziData);
      } catch (e) {
        console.error('Eroare la încărcarea programului:', e);
      }
    };

    getProgram();
  }, []);

  const ziAfisata = ziAzi;

  return (
    <>
      <div className="z-20 mt-16 md:mt-32 px-4 py-10 md:py-16 mb-2 flex flex-col items-center gap-6">
        <div className="w-full max-w-3xl p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4">

          {/* Left side: Date */}
          <div className="text-lg md:text-2xl font-normal text-gray text-center sm:text-left sm:flex-1">
            {ziAfisata?.data || '...'}
          </div>

          {/* Divider: Responsive Orientation */}
          <span className="bg-[#c95d43] w-1/2 h-[1.4px] sm:w-[1.4px] sm:h-[60px]"></span>

          {/* Right side: Activities */}
          <div className="text-sm md:text-base mt-1 text-gray sm:flex-1 text-center sm:text-left">
            {ziAfisata?.activitati.some(
              act => !act.ora && normalize(act.nume).includes('inchisa')
            ) ? (
              <p className="text-white">Biserica este închisă.</p>
            ) : (
              <div className="flex flex-col space-y-1">
                {ziAfisata?.activitati.map((act, i) => (
                  <div key={i}>
                    {act.ora && <strong>{act.ora} </strong>}
                    {act.nume}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeIn' }}
          className="text-xs md:text-sm leading-tight px-4 py-2 border border-[#c95d43] text-gray-800 font-normal cursor-pointer rounded-md hover:bg-gray-100 hover:text-black transition"
        >
          <Link href="/Program-Liturgic">Vezi programul săptămânii</Link>
        </motion.div>
      </div>
    </>

  );
};

export default Program;
