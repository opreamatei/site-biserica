"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

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
        const res = await fetch("/data/cateheze.json");
        const data = await res.json();
        setCateheze(data);
      } catch (error) {
        console.error("Eroare la încărcarea catehezelor:", error);
      }
    };

    loadCateheze();
  }, []);

  return (
    <div className="bg-[#0A0004]">
      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen w-screen px-6 py-12 text-white relative "
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
        <h1 className="text-4xl font-bold flex justify-center text-white mt-[80px] mb-12">
          Cateheze
        </h1>

        {cateheze.length === 0 && <p>Nu există date de afișat.</p>}

        {cateheze.map((item) => (
          <div
            key={item.id}
            className="mb-6 p-4 border-[#2b220a] border-4 rounded-lg shadow-sm  text-white/90"
            style={{
              backgroundImage: `
          linear-gradient(to bottom, transparent 0%, #1a1a1a 100%),
          linear-gradient(to top, transparent 50%, #1a1a1a 100%),
          url(/assets/fundal-program.png)
        `,
              backgroundColor: "black",
            }}
          >
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-white/60">{item.description}</p>
            <audio controls className="w-full mt-4 max-w-md bg-gray-100 rounded-xl shadow-lg border border-gray-300">
              <source src={item.audioUrl} type="audio/mpeg" />
              Browserul tău nu suportă audio.
            </audio>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default CatehezePage;
