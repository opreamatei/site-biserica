'use client';

import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

type Activitate = {
  ora: string;
  nume: string;
};

type Zi = {
  zi_saptamana: string;
  data: string;
  activitati: Activitate[];
};

export default function Page() {
  const [program, setProgram] = useState<Zi[]>([]);

  useEffect(() => {
    fetch('/data/program.json')
      .then((res) => res.json())
      .then((data) => {
        const programArray: Zi[] = Object.entries(data).map(([zi_saptamana, info]: any) => ({
          zi_saptamana,
          data: info.data,
          activitati: info.activitati,
        }));
        setProgram(programArray);
      })
      .catch((err) => console.error('Eroare la citirea programului:', err));
  }, []);

  return (
    <>
      <Navbar />
    <motion.div
      initial={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      animate={{ scale: 1, borderRadius: '0px', opacity: 1 }}
      exit={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="min-h-screen bg-[#020202] px-6 py-12 text-white"
    >
      <div className="flex justify-center text-white text-4xl mt-[100px] mb-12">
        Program liturgic
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        {program.map((zi, i) => (
          <div key={i} className="border-b border-white/20 pb-4">
            <div className="text-xl font-semibold mb-2">
              {zi.zi_saptamana.charAt(0).toUpperCase() + zi.zi_saptamana.slice(1)}, {zi.data}
            </div>
            <ul className="space-y-1 ml-4">
              {zi.activitati.map((act, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-white/70 w-[60px]">{act.ora}</span>
                  <span className="text-white/90">{act.nume}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
    </>
  );
}
