'use client'
import Navbar from '@/components/Navbar';
import React, { useEffect, useState } from 'react';

type Eveniment = {
  nume_eveniment: string;
  ora: string;
  adresa: string;
};

const EvenimentePage = () => {
  const [evenimente, setEvenimente] = useState<{ [key: string]: Eveniment }>({});

  useEffect(() => {
    const fetchEvenimente = async () => {
      try {
        const res = await fetch('/data/evenimente.json');
        const data = await res.json();
        setEvenimente(data);
      } catch (error) {
        console.error('Eroare la citirea fișierului JSON:', error);
      }
    };

    fetchEvenimente();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = Object.entries(evenimente)
    .filter(([date]) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    })
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <>
    <Navbar />
    <div className="text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Evenimente viitoare</h1>

      {upcoming.length === 0 ? (
        <p className="text-gray-400">Nu există evenimente viitoare disponibile.</p>
      ) : (
        <ul className="space-y-6">
          {upcoming.map(([date, ev]) => {
            const dataFormata = new Intl.DateTimeFormat('ro-RO', {
              day: 'numeric',
              month: 'long',
            }).format(new Date(date));

            return (
              <li key={date} className="border-l-4 border-[#c95d43] pl-4">
                <div className="text-lg font-semibold">{ev.nume_eveniment}</div>
                <div className="text-sm text-white/70">{dataFormata} • ora {ev.ora}</div>
                <div className="text-sm text-white/50">{ev.adresa}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </>
  );
};

export default EvenimentePage;
