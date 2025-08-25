'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar';
type Cateheza = {
  id: number;
  title: string;
  description: string;
  audioUrl: string;
};

const CatehezePage = () => {
  const [cateheze, setCateheze] = useState<Cateheza[]>([]);

  useEffect(() => {
    const loadCateheze = async () => {
      try {
        const res = await fetch('/data/cateheze.json');
        const data = await res.json();
        setCateheze(data);
      } catch (error) {
        console.error('Eroare la încărcarea catehezelor:', error);
      }
    };

    loadCateheze();
  }, []);

  return (
    <>              
    <Navbar />
    
     <motion.div
      initial={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      animate={{ scale: 1, borderRadius: '0px', opacity: 1 }}
      exit={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="min-h-screen px-6 py-12 text-white max-w-4xl mx-auto"
    >
      <h1 className="text-4xl font-bold flex justify-center text-white mt-[80px] mb-12">Cateheze</h1>

      {cateheze.length === 0 && <p>Nu există date de afișat.</p>}

      {cateheze.map((item) => (
        <div
          key={item.id}
          className="mb-6 p-4 border rounded-lg shadow-sm bg-white text-black"
        >
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <p className="mt-2 text-gray-700">{item.description}</p>
          <audio controls className="mt-4 w-full">
            <source src={item.audioUrl} type="audio/mpeg" />
            Browserul tău nu suportă audio.
          </audio>
        </div>
      ))}
    </motion.div>
    </>

  );
};

export default CatehezePage;
