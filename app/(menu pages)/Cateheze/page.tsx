"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Image from "next/image";
type Cateheza = {
  id: number;
  title: string;
  description: string;
  audioUrl: string;
};
import bgimg from "../../../public/assets/fundal-program.png";

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
  <div >
      <div className="absolute h-300 w-screen mask-b-from-0 inset-0 isolate opacity-100 -z-1">
        <div className="relative h-450">
          <Image
            fill
            className="z-4 object-cover absolute mix-blend-overlay"
            alt="background"
            src={"/background/concrete_wall_003_rough_8k.jpg"}
          />
          <Image
            className="z-4 blur-md scale-110 bg-black-800 object-cover"
            src={"/assets/fundal-program.png"}
            alt="program-background"
            fill
          />
        </div>
      </div>
      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen px-6 py-12 text-white max-w-4xl mx-auto"
      >
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
            <audio controls className="mt-4 w-full ">
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
