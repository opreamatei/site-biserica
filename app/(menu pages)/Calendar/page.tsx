'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

type LocalDay = {
  zi: number;
  zi_saptamana: string;
  sfinți: string[];
  tip: string;
  dezlegări: string[];
};

type FastInfo = {
  fast_level_desc: string;
  fast_exception_desc?: string;
};

export default function Programliturgic() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based
  const [year, setYear] = useState(today.getFullYear());

  const [calendar, setCalendar] = useState<Record<string, LocalDay> | null>(null);
  const [fastData, setFastData] = useState<Record<string, FastInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const localRes = await fetch('/data/calendar.json');
        const localData = await localRes.json();
        setCalendar(localData);

        const fastRes = await fetch(`https://orthocal.info/api/gregorian/${year}/${month}/`);
        const fastJson = await fastRes.json();

        const fastMap: Record<string, FastInfo> = {};
        fastJson.forEach((entry: any) => {
          const key = `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`;
          fastMap[key] = {
            fast_level_desc: entry.fast_level_desc,
            fast_exception_desc: entry.fast_exception_desc
          };
        });

        setFastData(fastMap);
      } catch (error) {
        console.error('Eroare la încărcare:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month, year]);

  const dayNames: Record<string, string> = {
    'L': 'luni',
    'Ma': 'marți',
    'Mi': 'miercuri',
    'J': 'joi',
    'V': 'vineri',
    'S': 'sâmbătă',
    'D': 'duminică'
  };

  const monthNames = [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
  ];

  const getMonthName = (monthNumber: number) => monthNames[monthNumber - 1] || '';

  const formatDate = (dateStr: string, data: LocalDay) => {
    const [_, m, d] = dateStr.split('-');
    const ziSapt = dayNames[data.zi_saptamana] || data.zi_saptamana;
    const luna = getMonthName(parseInt(m));
    return `${parseInt(d)} ${luna}, ${ziSapt}`;
  };

  const changeMonth = (offset: number) => {
    let newMonth = month + offset;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  return (
    <>
    <motion.div
      initial={{ scale: 0.98, borderRadius: '16px', opacity: 0 }}
      animate={{ scale: 1, borderRadius: '0px', opacity: 1 }}
      exit={{ scale: 0.98, borderRadius: '16px', opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#0A0004] px-6 py-12 pt-[100px] text-white"

    >
      <div className="absolute h-full mask-b-from-0 inset-0 isolate w-full opacity-20 z-6">
                <div className="relative h-full">
                  <Image
                    fill
                    className="z-4 object-cover absolute mix-blend-overlay"
                    alt="background"
                    src={"/background/concrete_wall_003_rough_8k.jpg"}
                  />
                  <Image
                    className="z-2 blur-md  bg-black-800 object-cover"
                    src={"/assets/fundal-program.png"}
                    alt="program-background"
                    fill
                  />
                </div>
              </div>
      <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="text-gray-300 hover:underline"
        >
          luna anterioară ←
        </button>

        <h1 className="text-[30px] font-bold text-center">
          Calendarul {getMonthName(month)} {year}
        </h1>

        <button
          onClick={() => changeMonth(1)}
          className="text-gray-300 hover:underline"
        >
          luna următoare →
        </button>
      </div>

      {loading && <p className="text-gray-400">Se încarcă...</p>}
      {!loading && calendar && Object.keys(calendar).length === 0 && (
        <p className="text-red-400">Eroare la încărcarea datelor.</p>
      )}

      {!loading && calendar && Object.entries(calendar).map(([date, data]) => {
        const [y, m] = date.split('-').map(Number);
        if (y !== year || m !== month) return null;

        return (
          <div key={date} className="mb-6 border-b border-[#c95d43] pb-4">
            <p className="text-lg font-semibold mb-1">{formatDate(date, data)}</p>

            {data.sfinți?.length > 0 && (
              <>
                <p><strong>Sfinți și sărbători:</strong></p>
                <ul className="list-disc list-inside ml-4 marker:text-[#c95d43]">
                  {data.sfinți.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            )}

            {fastData[date]?.fast_level_desc && (
              <p className="mt-2"><strong>Post:</strong> {fastData[date].fast_level_desc}</p>
            )}
            {fastData[date]?.fast_exception_desc && (
              <p><strong>Dezlegări:</strong> {fastData[date].fast_exception_desc}</p>
            )}
          </div>
        );
      })}
      </div>
    </motion.div>
    </>
  );
}
