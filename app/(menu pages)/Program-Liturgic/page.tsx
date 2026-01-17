"use client";
import Logo from "@/components/optimized/components/Logo";
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
    fetch("/api/program", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nu s-a putut incarca programul.");
        }
        return res.json();
      })
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
    <div className="bg-[#0A0004]">
      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative min-h-screen w-full px-6 py-12 text-white overflow-hidden"
      >
        <div className="absolute  mask-b-from-0 inset-0  w-full  opacity-50 md:opacity-80 ">
          <div className="relative w-full h-full">
        
          <Image
              className="z-2 object-cover md:hidden "
              src={"/assets/fundal-phone.png"}
              alt="program-background"
              fill
            />

          <Image
              className="z-2 object-cover hidden md:block opacity-40 "
              src={"/assets/fundal2.png"}
              alt="program-background"
              fill
            />
          </div> 
        </div>


        <h1 className="relative z-2 flex justify-center text-center text-white/90 text-4xl md:text-7xl mt-[100px] mb-15 underline decoration-2 underline-offset-8">
          Program liturgic
        </h1>

        <div className="relative z-1 max-w-4xl mx-auto space-y-10 mb-20">
          {program.map((zi, i) => (
            <div key={i} className="border-b border-[#C59D30]/30 pb-4">
              <span className="text-2xl font-[merriweather] font-semibold text-[#C59D30]">
                {zi.zi_saptamana.charAt(0).toUpperCase() +
                  zi.zi_saptamana.slice(1)}
              </span>
              <span className="text-[#C59D30]/90">, {zi.data}</span>
              <ul className="space-y-1 ml-4 mb-6 mt-6 ">
                {zi.activitati.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className=" w-[60px] text-[#C59D30]/90">{act.ora}</span>
                    <span className="text-white/90 flex align-baseline">{act.nume}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Logo theme='light' />
      </motion.div>
    </div>
  );
}
