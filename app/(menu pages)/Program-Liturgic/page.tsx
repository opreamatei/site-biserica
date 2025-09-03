"use client";

import Navbar from "@/components/Navbar";
import Background from "@/components/spec/background";
import { motion } from "framer-motion";
import Image from "next/image";
import React, { useEffect, useState } from "react";

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
    fetch("/data/program.json")
      .then((res) => res.json())
      .then((data) => {
        const programArray: Zi[] = Object.entries(data).map(
          ([zi_saptamana, info]: any) => ({
            zi_saptamana,
            data: info.data,
            activitati: info.activitati,
          })
        );
        setProgram(programArray);
      })
      .catch((err) => console.error("Eroare la citirea programului:", err));
  }, []);

  return (
    <div className="bg-black">
      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen w-screen  px-6 py-12 text-white relative "
      >
        <div className="absolute h-470 mask-b-from-0 inset-0 isolate w-full opacity-20 z-6">
          <div className="relative h-450">
            <Image
              fill
              className="z-4 object-cover absolute mix-blend-overlay"
              alt="background"
              src={"/background/concrete_wall_003_rough_8k.jpg"}
            />
            <Image
              className="z-2 blur-md scale-110 bg-black-800 object-cover"
              src={"/assets/fundal-program.png"}
              alt="program-background"
              fill
            />
          </div>
        </div>

        <h1 className="relative z-2 flex justify-center text-center text-4xl md:text-7xl mt-[100px] mb-12 underline decoration-2 underline-offset-8">
          Program liturgic
        </h1>

        <div className="relative z-1 max-w-4xl mx-auto space-y-10 mb-20">
          {program.map((zi, i) => (
            <div key={i} className="border-b border-white/20 pb-4">
              <span className="text-2xl font-semibold">
                {zi.zi_saptamana.charAt(0).toUpperCase() +
                  zi.zi_saptamana.slice(1)}
              </span>
              <span>, {zi.data}</span>
              <ul className="space-y-1 ml-4 mb-6 mt-2 ">
                {zi.activitati.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className=" w-[60px]">{act.ora}</span>
                    <span className="">{act.nume}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
